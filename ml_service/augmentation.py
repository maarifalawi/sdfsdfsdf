import os
import cv2
import numpy as np
from PIL import Image
import albumentations as A
from tqdm import tqdm
import json
from pathlib import Path
import shutil
from collections import defaultdict

class BatikAugmentationPipeline:
    def __init__(self, data_dir='data', target_samples_per_class=100):
        self.data_dir = Path(data_dir)
        self.train_dir = self.data_dir / 'train'
        self.augmented_dir = self.data_dir / 'augmented'
        self.target_samples_per_class = target_samples_per_class

        # Create augmented directory
        self.augmented_dir.mkdir(exist_ok=True)

        # Advanced augmentation pipeline
        self.augmentation = A.Compose([
            A.Rotate(limit=45, p=0.7),
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.3),
            A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.6),
            A.GaussianBlur(blur_limit=3, p=0.3),
            A.GaussNoise(var_limit=(10, 50), p=0.4),
            A.RandomCrop(width=160, height=160, p=0.5),
            A.Resize(180, 180, always_apply=True),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225], always_apply=True)
        ])

    def scan_dataset(self):
        """Scan existing dataset and return statistics"""
        class_stats = defaultdict(int)
        total_images = 0

        if not self.train_dir.exists():
            print("❌ Dataset directory not found!")
            return class_stats, total_images

        for class_dir in self.train_dir.iterdir():
            if class_dir.is_dir():
                images = list(class_dir.glob('*.jpg')) + list(class_dir.glob('*.jpeg')) + list(class_dir.glob('*.png'))
                class_stats[class_dir.name] = len(images)
                total_images += len(images)

        print("📊 Dataset Statistics:")
        print(f"   Total classes: {len(class_stats)}")
        print(f"   Total images: {total_images}")
        for class_name, count in class_stats.items():
            print(f"   {class_name}: {count} images")

        return class_stats, total_images

    def augment_class(self, class_name, source_dir, target_dir, current_count):
        """Augment images for a specific class"""
        target_count = self.target_samples_per_class
        augment_needed = max(0, target_count - current_count)

        if augment_needed == 0:
            print(f"✅ {class_name}: Already has {current_count} images (target: {target_count})")
            return 0

        # Get source images
        source_images = list(source_dir.glob('*.jpg')) + list(source_dir.glob('*.jpeg')) + list(source_dir.glob('*.png'))

        if not source_images:
            print(f"⚠️  {class_name}: No source images found")
            return 0

        augmented_count = 0
        target_dir.mkdir(exist_ok=True)

        print(f"🔄 {class_name}: Augmenting {augment_needed} images from {len(source_images)} originals")

        # Copy original images first
        for i, img_path in enumerate(source_images):
            if current_count + i >= target_count:
                break
            shutil.copy2(img_path, target_dir / f"original_{i}_{img_path.name}")
            augmented_count += 1

        # Generate augmented images
        with tqdm(total=augment_needed - (len(source_images) if len(source_images) < augment_needed else 0),
                 desc=f"Augmenting {class_name}") as pbar:

            aug_idx = 0
            while augmented_count < target_count:
                # Randomly select source image
                source_img = np.random.choice(source_images)

                try:
                    # Load and augment image
                    image = cv2.imread(str(source_img))
                    if image is None:
                        continue

                    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

                    # Apply augmentation
                    augmented = self.augmentation(image=image)['image']

                    # Convert back to PIL and save
                    augmented_pil = Image.fromarray(augmented)
                    aug_filename = f"aug_{aug_idx}_{source_img.stem}.jpg"
                    augmented_pil.save(target_dir / aug_filename, 'JPEG', quality=95)

                    augmented_count += 1
                    aug_idx += 1
                    pbar.update(1)

                except Exception as e:
                    print(f"Error augmenting {source_img}: {e}")
                    continue

        return augmented_count

    def run_augmentation(self):
        """Run complete augmentation pipeline"""
        print("🚀 Starting Batik Dataset Augmentation Pipeline")
        print("=" * 50)

        # Scan existing dataset
        class_stats, total_original = self.scan_dataset()

        if not class_stats:
            print("❌ No dataset found to augment!")
            return

        total_augmented = 0
        augmented_stats = {}

        # Augment each class
        for class_name, current_count in class_stats.items():
            source_dir = self.train_dir / class_name
            target_dir = self.augmented_dir / class_name

            augmented = self.augment_class(class_name, source_dir, target_dir, current_count)
            augmented_stats[class_name] = current_count + augmented
            total_augmented += augmented

        # Print final statistics
        print("\n" + "=" * 50)
        print("✅ Augmentation Complete!")
        print(f"📊 Final Statistics:")
        print(f"   Original images: {total_original}")
        print(f"   Augmented images: {total_augmented}")
        print(f"   Total images: {total_original + total_augmented}")
        print(f"   Target per class: {self.target_samples_per_class}")
        print("\n📈 Class Distribution:")
        for class_name, count in augmented_stats.items():
            status = "✅" if count >= self.target_samples_per_class else "⚠️"
            print(f"   {status} {class_name}: {count} images")

        # Save augmentation report
        report = {
            'original_stats': dict(class_stats),
            'augmented_stats': augmented_stats,
            'total_original': total_original,
            'total_augmented': total_augmented,
            'target_per_class': self.target_samples_per_class,
            'augmentation_pipeline': str(self.augmentation)
        }

        with open(self.data_dir / 'augmentation_report.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"\n📄 Report saved to: {self.data_dir / 'augmentation_report.json'}")
        return augmented_stats

if __name__ == '__main__':
    # Run augmentation
    pipeline = BatikAugmentationPipeline(target_samples_per_class=150)
    pipeline.run_augmentation()