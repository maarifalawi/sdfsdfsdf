import os
import json
import numpy as np
import albumentations as A
from pathlib import Path
from tensorflow.keras import layers, models, callbacks
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import logging

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
IMAGE_SIZE = (180, 180)
BATCH_SIZE = 16
LABELS_FILE = BASE_DIR / 'labels.json'
MODEL_PATH = BASE_DIR / 'model.h5'
METRICS_PATH = BASE_DIR / 'metrics.json'
TRAINING_HISTORY_PATH = BASE_DIR / 'training_history.json'
TRAINING_STATUS_PATH = BASE_DIR / 'training_status.json'


def _save_json(path, data):
    """Save data to JSON with proper numpy type conversion"""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    def convert_types(obj):
        """Convert numpy and other non-serializable types to Python native types"""
        if isinstance(obj, dict):
            return {k: convert_types(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [convert_types(item) for item in obj]
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, (np.integer, np.floating)):
            return obj.item()
        elif isinstance(obj, (np.bool_)):
            return bool(obj)
        return obj
    
    converted_data = convert_types(data)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(converted_data, f, indent=2, ensure_ascii=False)


def _update_training_status(state, progress=0, log=None, details=None):
    payload = {
        'state': state,
        'progress': int(progress),
        'log': log,
        'details': details or {},
    }
    try:
        _save_json(TRAINING_STATUS_PATH, payload)
    except Exception:
        pass
    return payload


class TrainingProgressCallback(callbacks.Callback):
    def __init__(self):
        super().__init__()

    def on_train_begin(self, logs=None):
        _update_training_status('running', progress=0, log='Training dimulai')

    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        total_epochs = self.params.get('epochs', 0)
        progress = int(((epoch + 1) / total_epochs) * 100) if total_epochs else 0
        log_line = (
            f"Epoch {epoch + 1}/{total_epochs} - "
            f"loss={logs.get('loss', 0):.4f}, "
            f"val_loss={logs.get('val_loss', 0):.4f}, "
            f"accuracy={logs.get('accuracy', 0):.4f}, "
            f"val_accuracy={logs.get('val_accuracy', 0):.4f}"
        )
        _update_training_status('running', progress=progress, log=log_line, details={
            'epoch': epoch + 1,
            'total_epochs': total_epochs,
            'loss': float(logs.get('loss', 0) or 0),
            'val_loss': float(logs.get('val_loss', 0) or 0),
            'accuracy': float(logs.get('accuracy', 0) or 0),
            'val_accuracy': float(logs.get('val_accuracy', 0) or 0),
        })

    def on_train_end(self, logs=None):
        _update_training_status('completed', progress=100, log='Training selesai.')


def create_model(num_classes):
    base_model = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3),
        pooling='avg',
    )
    base_model.trainable = False

    inputs = layers.Input(shape=(*IMAGE_SIZE, 3))
    x = preprocess_input(inputs)
    x = base_model(x, training=False)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(256, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)

    model = models.Model(inputs, outputs)
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy'],
    )
    return model


def load_labels():
    if LABELS_FILE.exists():
        try:
            with open(LABELS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading labels: {e}")
    return []

def save_labels(labels):
    _save_json(LABELS_FILE, labels)

def build_generators(dataset_path):
    dataset_path = Path(dataset_path)
    train_dir = dataset_path / 'train'

    if not train_dir.is_dir():
        raise FileNotFoundError(f'Folder dataset/train tidak ditemukan di {train_dir}.')

    class_counts = {}
    total_images = 0
    for label_path in train_dir.iterdir():
        if label_path.is_dir():
            count = len(list(label_path.glob('*.[jJ][pP][gG]')) + list(label_path.glob('*.[jJ][pP][eE][gG]')) + list(label_path.glob('*.[pP][nN][gG]')))
            class_counts[label_path.name] = count
            total_images += count

    logger.info(f"Dataset distribution: {class_counts}")

    if total_images == 0:
        raise FileNotFoundError(f'Tidak ada gambar di {train_dir}. Silakan upload dataset terlebih dahulu.')

    augmentation = A.Compose([
        A.OneOf([
            A.GaussianBlur(blur_limit=(3, 7), p=0.4),
            A.MotionBlur(blur_limit=7, p=0.25),
            A.MedianBlur(blur_limit=3, p=0.2),
            A.ImageCompression(quality_lower=30, quality_upper=100, p=0.25),
        ], p=0.5),
        A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.6),
    ], p=0.8)

    def training_preprocess(img_array):
        img_array = img_array.astype(np.uint8)
        augmented = augmentation(image=img_array)['image']
        return preprocess_input(augmented.astype(np.float32))

    train_datagen = ImageDataGenerator(
        preprocessing_function=training_preprocess,
        rotation_range=45,
        width_shift_range=0.3,
        height_shift_range=0.3,
        shear_range=0.3,
        zoom_range=0.3,
        horizontal_flip=True,
        vertical_flip=True,
        brightness_range=(0.5, 1.5),
        channel_shift_range=0.2,
        fill_mode='reflect',
        validation_split=0.2,
    )

    val_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        validation_split=0.2,
    )

    train_gen = train_datagen.flow_from_directory(
        str(train_dir),
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='sparse',
        subset='training',
        shuffle=True,
    )
    val_gen = val_datagen.flow_from_directory(
        str(train_dir),
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='sparse',
        subset='validation',
        shuffle=False,
    )

    if train_gen.samples == 0 or val_gen.samples == 0:
        raise ValueError('Dataset terlalu kecil untuk split train/validation. Pastikan setiap kelas memiliki setidaknya 2 gambar.')

    labels = list(train_gen.class_indices.keys())
    save_labels(labels)
    return train_gen, val_gen, labels


def train_model(dataset_path='data'):
    try:
        _update_training_status('starting', progress=0, log='Memvalidasi dataset training...')
        dataset_path = Path(dataset_path)
        train_gen, val_gen, labels = build_generators(dataset_path)

        if len(labels) < 2:
            raise ValueError('Needs at least 2 classes for training.')

        model = create_model(len(labels))
        
        from sklearn.utils.class_weight import compute_class_weight
        class_weights = compute_class_weight(
            'balanced',
            classes=np.unique(train_gen.classes),
            y=train_gen.classes
        )
        class_weight_dict = dict(enumerate(class_weights))

        checkpoint = callbacks.ModelCheckpoint(
            str(MODEL_PATH),
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1,
        )
        early_stop = callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=5,
            restore_best_weights=True,
            mode='max',
            verbose=1,
        )
        reduce_lr = callbacks.ReduceLROnPlateau(
            monitor='val_accuracy',
            factor=0.5,
            patience=3,
            min_lr=1e-6,
            mode='max',
            verbose=1
        )
        progress_callback = TrainingProgressCallback()

        history = model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=10,
            class_weight=class_weight_dict,
            callbacks=[checkpoint, early_stop, reduce_lr, progress_callback],
        )

        history_data = history.history
        _save_json(TRAINING_HISTORY_PATH, history_data)

        if not MODEL_PATH.exists():
            model.save(MODEL_PATH)

        # Ensure all values are JSON-serializable by converting numpy types
        val_accuracy_list = history_data.get('val_accuracy', history_data.get('accuracy', []))
        val_loss_list = history_data.get('val_loss', history_data.get('loss', []))
        
        if val_accuracy_list:
            final_accuracy = float(val_accuracy_list[-1].item() if hasattr(val_accuracy_list[-1], 'item') else val_accuracy_list[-1])
        else:
            final_accuracy = 0.0
            
        if val_loss_list:
            final_loss = float(val_loss_list[-1].item() if hasattr(val_loss_list[-1], 'item') else val_loss_list[-1])
        else:
            final_loss = 0.0
        
        metrics = {
            'accuracy': final_accuracy,
            'loss': final_loss,
            'epochs_trained': int(len(history_data.get('loss', []))),
            'classes': [str(label) for label in labels],  # Ensure string labels
            'timestamp': str(os.path.getmtime(MODEL_PATH)) if MODEL_PATH.exists() else None,
        }
        _save_json(METRICS_PATH, metrics)
        _update_training_status('completed', progress=100, log='Training selesai.', details=metrics)

        return metrics, list(labels)
    except Exception as e:
        error_msg = f"Training model error: {str(e)}"
        import traceback
        traceback.print_exc()
        _update_training_status('failed', progress=0, log=error_msg)
        raise
