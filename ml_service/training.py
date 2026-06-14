import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks, optimizers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB3
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.mixed_precision import experimental as mixed_precision
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, auc
from sklearn.utils.class_weight import compute_class_weight
import pandas as pd
from pathlib import Path
import datetime
from tqdm import tqdm

# Enable mixed precision for faster training
policy = mixed_precision.Policy('mixed_float16')
mixed_precision.set_policy(policy)

class AdvancedBatikTrainer:
    def __init__(self, data_dir='data', model_dir='models'):
        self.data_dir = Path(data_dir)
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(exist_ok=True)

        self.IMAGE_SIZE = (224, 224)  # Larger for EfficientNetB3
        self.BATCH_SIZE = 16
        self.EPOCHS = 100

        # Use augmented data if available
        self.train_dir = self.data_dir / 'augmented' if (self.data_dir / 'augmented').exists() else self.data_dir / 'train'

        # Model configuration
        self.model_path = self.model_dir / 'batik_model.h5'
        self.history_path = self.model_dir / 'training_history.json'
        self.metrics_path = self.model_dir / 'model_metrics.json'

    def build_advanced_model(self, num_classes):
        """Build advanced EfficientNetB3 model with fine-tuning"""
        print("🏗️  Building Advanced EfficientNetB3 Model...")

        # Load EfficientNetB3 with ImageNet weights
        base_model = EfficientNetB3(
            weights='imagenet',
            include_top=False,
            input_shape=(*self.IMAGE_SIZE, 3),
            pooling='avg'
        )

        # Freeze base model initially
        base_model.trainable = False

        # Advanced head with regularization
        inputs = layers.Input(shape=(*self.IMAGE_SIZE, 3))
        x = preprocess_input(inputs)

        # Feature extraction
        x = base_model(x, training=False)

        # Advanced classification head
        x = layers.Dropout(0.5)(x)
        x = layers.Dense(512, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(0.001))(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.4)(x)
        x = layers.Dense(256, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(0.001))(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(128, activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dropout(0.2)(x)

        # Output layer
        outputs = layers.Dense(num_classes, activation='softmax', dtype='float32')(x)

        model = models.Model(inputs, outputs)

        # Learning rate schedule
        lr_schedule = tf.keras.optimizers.schedules.ExponentialDecay(
            initial_learning_rate=1e-3,
            decay_steps=1000,
            decay_rate=0.9,
            staircase=True
        )

        optimizer = optimizers.Adam(learning_rate=lr_schedule)

        model.compile(
            optimizer=optimizer,
            loss='sparse_categorical_crossentropy',
            metrics=[
                'accuracy',
                tf.keras.metrics.Precision(name='precision'),
                tf.keras.metrics.Recall(name='recall'),
                tf.keras.metrics.TopKCategoricalAccuracy(k=3, name='top_3_accuracy')
            ]
        )

        return model, base_model

    def setup_data_generators(self):
        """Setup advanced data generators with augmentation"""
        print("📦 Setting up Data Generators...")

        # Enhanced training augmentation
        train_datagen = ImageDataGenerator(
            preprocessing_function=preprocess_input,
            rotation_range=30,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            vertical_flip=True,
            brightness_range=(0.8, 1.2),
            channel_shift_range=0.1,
            fill_mode='reflect',
            validation_split=0.2,
        )

        # Validation generator (no augmentation)
        val_datagen = ImageDataGenerator(
            preprocessing_function=preprocess_input,
            validation_split=0.2,
        )

        # Training generator
        train_gen = train_datagen.flow_from_directory(
            self.train_dir,
            target_size=self.IMAGE_SIZE,
            batch_size=self.BATCH_SIZE,
            class_mode='sparse',
            subset='training',
            shuffle=True,
        )

        # Validation generator
        val_gen = val_datagen.flow_from_directory(
            self.train_dir,
            target_size=self.IMAGE_SIZE,
            batch_size=self.BATCH_SIZE,
            class_mode='sparse',
            subset='validation',
            shuffle=False,
        )

        # Compute class weights
        class_weights = compute_class_weight(
            'balanced',
            classes=np.unique(train_gen.classes),
            y=train_gen.classes
        )
        class_weight_dict = dict(enumerate(class_weights))

        labels = list(train_gen.class_indices.keys())

        print(f"📊 Training samples: {train_gen.samples}")
        print(f"📊 Validation samples: {val_gen.samples}")
        print(f"📊 Classes: {labels}")
        print(f"⚖️  Class weights: {class_weight_dict}")

        return train_gen, val_gen, labels, class_weight_dict

    def setup_callbacks(self):
        """Setup advanced training callbacks"""
        print("⚙️  Setting up Training Callbacks...")

        callbacks_list = []

        # Model checkpoint
        checkpoint = callbacks.ModelCheckpoint(
            self.model_path,
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1,
            save_weights_only=False
        )
        callbacks_list.append(checkpoint)

        # Early stopping
        early_stop = callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=10,
            restore_best_weights=True,
            mode='max',
            verbose=1,
            min_delta=0.001
        )
        callbacks_list.append(early_stop)

        # Reduce LR on plateau
        reduce_lr = callbacks.ReduceLROnPlateau(
            monitor='val_accuracy',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            mode='max',
            verbose=1
        )
        callbacks_list.append(reduce_lr)

        # TensorBoard
        log_dir = self.model_dir / 'logs' / datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        tensorboard = callbacks.TensorBoard(
            log_dir=log_dir,
            histogram_freq=1,
            write_graph=True,
            write_images=True,
            update_freq='epoch'
        )
        callbacks_list.append(tensorboard)

        # CSV Logger
        csv_logger = callbacks.CSVLogger(self.model_dir / 'training.log')
        callbacks_list.append(csv_logger)

        return callbacks_list

    def fine_tune_model(self, model, base_model, train_gen, val_gen, class_weights):
        """Fine-tune the model by unfreezing some layers"""
        print("🔧 Fine-tuning model...")

        # Unfreeze last 30 layers for fine-tuning
        for layer in base_model.layers[-30:]:
            layer.trainable = True

        # Lower learning rate for fine-tuning
        model.compile(
            optimizer=optimizers.Adam(learning_rate=1e-5),
            loss='sparse_categorical_crossentropy',
            metrics=[
                'accuracy',
                tf.keras.metrics.Precision(name='precision'),
                tf.keras.metrics.Recall(name='recall'),
                tf.keras.metrics.TopKCategoricalAccuracy(k=3, name='top_3_accuracy')
            ]
        )

        # Fine-tune for additional epochs
        fine_tune_history = model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=20,
            class_weight=class_weights,
            callbacks=self.setup_callbacks(),
            initial_epoch=0
        )

        return fine_tune_history

    def train_model(self):
        """Main training function"""
        print("🚀 Starting Advanced Batik Training Pipeline")
        print("=" * 60)

        # Setup data
        train_gen, val_gen, labels, class_weights = self.setup_data_generators()

        if len(labels) < 2:
            raise ValueError("Need at least 2 classes for training!")

        # Build model
        model, base_model = self.build_advanced_model(len(labels))

        # Initial training with frozen base
        print("📚 Phase 1: Training with frozen base model")
        history1 = model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=self.EPOCHS,
            class_weight=class_weights,
            callbacks=self.setup_callbacks(),
        )

        # Fine-tuning phase
        print("\n🔧 Phase 2: Fine-tuning with unfrozen layers")
        history2 = self.fine_tune_model(model, base_model, train_gen, val_gen, class_weights)

        # Combine histories
        combined_history = self.combine_histories(history1, history2)

        # Save model and metrics
        self.save_training_results(model, combined_history, labels, val_gen)

        # Generate comprehensive evaluation
        self.evaluate_model(model, val_gen, labels)

        print("✅ Training Complete!")
        print(f"📁 Model saved to: {self.model_path}")
        print(f"📊 Metrics saved to: {self.metrics_path}")

        return model, combined_history, labels

    def combine_histories(self, h1, h2):
        """Combine two training histories"""
        combined = {}
        for key in h1.history.keys():
            combined[key] = h1.history[key] + h2.history[key]
        return combined

    def save_training_results(self, model, history, labels, val_gen):
        """Save training results and metrics"""
        # Save model
        model.save(self.model_path)

        # Save labels
        with open(self.model_dir / 'labels.json', 'w', encoding='utf-8') as f:
            json.dump(labels, f)

        # Save training history
        with open(self.history_path, 'w', encoding='utf-8') as f:
            json.dump(history, f, indent=2)

        # Calculate final metrics
        final_metrics = {
            'final_accuracy': float(history['val_accuracy'][-1]),
            'final_precision': float(history['val_precision'][-1]),
            'final_recall': float(history['val_recall'][-1]),
            'final_top3_accuracy': float(history['val_top_3_accuracy'][-1]),
            'best_accuracy': float(max(history['val_accuracy'])),
            'epochs_trained': len(history['loss']),
            'classes': labels,
            'training_samples': val_gen.samples,
            'timestamp': datetime.datetime.now().isoformat()
        }

        with open(self.metrics_path, 'w', encoding='utf-8') as f:
            json.dump(final_metrics, f, indent=2)

    def evaluate_model(self, model, val_gen, labels):
        """Comprehensive model evaluation"""
        print("🔍 Evaluating Model Performance...")

        # Get predictions
        steps = np.ceil(val_gen.samples / self.BATCH_SIZE)
        predictions = model.predict(val_gen, steps=int(steps), verbose=1)
        predicted_classes = np.argmax(predictions, axis=1)
        true_classes = val_gen.classes

        # Classification report
        report = classification_report(
            true_classes,
            predicted_classes,
            target_names=labels,
            output_dict=True,
            zero_division=0
        )

        # Confusion matrix
        cm = confusion_matrix(true_classes, predicted_classes)

        # Save evaluation results
        evaluation_results = {
            'classification_report': report,
            'confusion_matrix': cm.tolist(),
            'samples': int(val_gen.samples),
            'labels': labels
        }

        with open(self.model_dir / 'evaluation_results.json', 'w', encoding='utf-8') as f:
            json.dump(evaluation_results, f, indent=2)

        # Generate plots
        self.generate_evaluation_plots(cm, labels, predictions, true_classes)

        print("📊 Evaluation Results:")
        print(".4f"        print(".4f"        print(".4f"
    def generate_evaluation_plots(self, cm, labels, predictions, true_classes):
        """Generate evaluation plots"""
        plt.style.use('default')

        # Confusion Matrix
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=labels, yticklabels=labels)
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(self.model_dir / 'confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.close()

        # Prediction confidence distribution
        plt.figure(figsize=(10, 6))
        max_probs = np.max(predictions, axis=1)
        plt.hist(max_probs, bins=20, alpha=0.7, edgecolor='black')
        plt.xlabel('Prediction Confidence')
        plt.ylabel('Frequency')
        plt.title('Prediction Confidence Distribution')
        plt.grid(True, alpha=0.3)
        plt.savefig(self.model_dir / 'confidence_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()

if __name__ == '__main__':
    trainer = AdvancedBatikTrainer()
    trainer.train_model()