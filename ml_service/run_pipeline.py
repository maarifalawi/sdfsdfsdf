#!/usr/bin/env python3
"""
Advanced Batik Classification Pipeline Runner
===========================================

This script runs the complete ML pipeline:
1. Dataset augmentation
2. Model training
3. Evaluation
4. Analytics generation

Usage:
    python run_pipeline.py [--augment] [--train] [--evaluate]

Options:
    --augment   : Run dataset augmentation
    --train     : Run model training
    --evaluate  : Run model evaluation
    --all       : Run all steps (default)
"""

import argparse
import sys
import os
from pathlib import Path

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_augmentation():
    """Run dataset augmentation"""
    print("🚀 Starting Dataset Augmentation...")
    try:
        from augmentation import BatikAugmentationPipeline
        pipeline = BatikAugmentationPipeline(target_samples_per_class=150)
        stats = pipeline.run_augmentation()
        print("✅ Augmentation completed!")
        return True
    except Exception as e:
        print(f"❌ Augmentation failed: {e}")
        return False

def run_training():
    """Run model training"""
    print("🚀 Starting Model Training...")
    try:
        from training import AdvancedBatikTrainer
        trainer = AdvancedBatikTrainer()
        model, history, labels = trainer.train_model()
        print("✅ Training completed!")
        return True
    except Exception as e:
        print(f"❌ Training failed: {e}")
        return False

def run_evaluation():
    """Run model evaluation"""
    print("🚀 Starting Model Evaluation...")
    try:
        from training import AdvancedBatikTrainer
        trainer = AdvancedBatikTrainer()
        trainer.evaluate_model(trainer.model, trainer.val_gen, trainer.labels)
        print("✅ Evaluation completed!")
        return True
    except Exception as e:
        print(f"❌ Evaluation failed: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Advanced Batik Classification Pipeline')
    parser.add_argument('--augment', action='store_true', help='Run dataset augmentation')
    parser.add_argument('--train', action='store_true', help='Run model training')
    parser.add_argument('--evaluate', action='store_true', help='Run model evaluation')
    parser.add_argument('--all', action='store_true', help='Run all steps')

    args = parser.parse_args()

    # If no specific args, run all
    if not any([args.augment, args.train, args.evaluate]):
        args.all = True

    success_count = 0
    total_steps = 0

    if args.all or args.augment:
        total_steps += 1
        if run_augmentation():
            success_count += 1

    if args.all or args.train:
        total_steps += 1
        if run_training():
            success_count += 1

    if args.all or args.evaluate:
        total_steps += 1
        if run_evaluation():
            success_count += 1

    print(f"\n{'='*50}")
    print("🎉 Pipeline Summary"    print(f"   Steps completed: {success_count}/{total_steps}")
    print(f"   Success rate: {(success_count/total_steps)*100:.1f}%")

    if success_count == total_steps:
        print("   Status: ✅ All steps completed successfully!")
        print("\n📁 Generated files:")
        print("   - data/augmentation_report.json")
        print("   - models/batik_model.h5")
        print("   - models/training_history.json")
        print("   - models/model_metrics.json")
        print("   - models/evaluation_results.json")
        print("   - models/confusion_matrix.png")
        print("   - models/confidence_distribution.png")
        print("\n🚀 Ready for production!")
    else:
        print("   Status: ⚠️  Some steps failed")
        sys.exit(1)

if __name__ == '__main__':
    main()