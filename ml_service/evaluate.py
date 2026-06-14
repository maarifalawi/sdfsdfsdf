import argparse
import json
import math
import os
from pathlib import Path

import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model

from model import IMAGE_SIZE, MODEL_PATH, preprocess_input, load_labels


def evaluate_dataset(dataset_path: str, model_path: str, batch_size: int = 16):
    if not os.path.isdir(dataset_path):
        raise FileNotFoundError(f'Dataset folder tidak ditemukan: {dataset_path}')

    labels = load_labels()
    if not labels:
        raise FileNotFoundError('Label belum tersedia. Jalankan training terlebih dahulu.')

    if not os.path.exists(model_path):
        raise FileNotFoundError(f'Model tidak ditemukan: {model_path}')

    validation_dir = os.path.join(dataset_path, 'train')
    if not os.path.isdir(validation_dir):
        raise FileNotFoundError(f'Folder dataset/train tidak ditemukan di {validation_dir}.')

    data_gen = ImageDataGenerator(preprocessing_function=preprocess_input, validation_split=0.2)
    val_gen = data_gen.flow_from_directory(
        validation_dir,
        target_size=IMAGE_SIZE,
        batch_size=batch_size,
        class_mode='sparse',
        subset='validation',
        shuffle=False,
    )

    model = load_model(model_path)
    steps = math.ceil(val_gen.samples / batch_size)
    predictions = model.predict(val_gen, steps=steps, verbose=1)
    predicted_labels = np.argmax(predictions, axis=1)
    true_labels = val_gen.classes

    labels_order = [label for label, _ in sorted(val_gen.class_indices.items(), key=lambda x: x[1])]
    report = classification_report(true_labels, predicted_labels, target_names=labels_order, output_dict=True, zero_division=0)
    confusion = confusion_matrix(true_labels, predicted_labels)

    return {
        'samples': int(val_gen.samples),
        'labels': labels_order,
        'report': report,
        'confusion_matrix': confusion.tolist(),
    }


def save_report(report_data: dict, output_path: str):
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)


def pretty_print(report_data: dict):
    print('Validation report')
    print('=================')
    print(f"Samples: {report_data['samples']}")
    print('Labels:', ', '.join(report_data['labels']))
    print('\nClassification report:')

    report = report_data['report']
    for label in report_data['labels']:
        if label in report:
            metrics = report[label]
            print(f"  {label}: precision={metrics['precision']:.4f}, recall={metrics['recall']:.4f}, f1-score={metrics['f1-score']:.4f}, support={int(metrics['support'])}")

    accuracy = report.get('accuracy', {}).get('precision') if isinstance(report.get('accuracy'), dict) else report.get('accuracy')
    if accuracy is not None:
        print(f"\nOverall accuracy: {accuracy:.4f}")

    print('\nConfusion matrix:')
    for row in report_data['confusion_matrix']:
        print('  ' + ' '.join(str(x) for x in row))


def parse_args():
    parser = argparse.ArgumentParser(description='Evaluate batik classification model on validation data')
    parser.add_argument('--dataset', default='data', help='Path to dataset folder containing train/<label> subfolders')
    parser.add_argument('--model', default=MODEL_PATH, help='Path to saved Keras model file')
    parser.add_argument('--batch-size', type=int, default=16, help='Batch size for validation evaluation')
    parser.add_argument('--output', default='validation_report.json', help='Output file for the JSON validation report')
    return parser.parse_args()


if __name__ == '__main__':
    args = parse_args()
    report = evaluate_dataset(args.dataset, args.model, args.batch_size)
    pretty_print(report)
    save_report(report, args.output)
    print(f"\nValidation report written to: {args.output}")
