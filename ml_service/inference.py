import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.efficientnet import preprocess_input
from sklearn.metrics.pairwise import cosine_similarity
import cv2
from PIL import Image
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedBatikInference:
    def __init__(self, model_path='model.h5', labels_path='labels.json'):
        self.model_path = Path(model_path)
        self.labels_path = Path(labels_path)
        self.image_size = (180, 180)  # Match training size

        # Load model and labels
        self.model = None
        self.labels = []
        self.feature_extractor = None
        self.load_model()

        # Confidence thresholds
        self.high_confidence_threshold = 0.8
        self.medium_confidence_threshold = 0.5
        self.low_confidence_threshold = 0.3

        # Initialize feature extractor for similarity
        self.setup_feature_extractor()

    def load_model(self):
        """Load the trained model and labels"""
        try:
            if self.model_path.exists():
                self.model = load_model(self.model_path)
                logger.info(f"✅ Model loaded from {self.model_path}")
            else:
                logger.warning(f"⚠️  Model not found at {self.model_path}")
                return

            if self.labels_path.exists():
                with open(self.labels_path, 'r', encoding='utf-8') as f:
                    self.labels = json.load(f)
                logger.info(f"✅ Labels loaded: {len(self.labels)} classes")
            else:
                logger.warning(f"⚠️  Labels not found at {self.labels_path}")

        except Exception as e:
            logger.error(f"❌ Error loading model: {e}")
            raise

    def setup_feature_extractor(self):
        """Setup feature extractor for similarity matching"""
        if self.model is None:
            return

        try:
            # Create feature extractor from the model (remove classification layers)
            self.feature_extractor = tf.keras.Model(
                inputs=self.model.inputs,
                outputs=self.model.layers[-5].output  # Get features before final dense layers
            )
            logger.info("✅ Feature extractor ready for similarity matching")
        except Exception as e:
            logger.warning(f"⚠️  Could not setup feature extractor: {e}")

    def enhance_image(self, img_array: np.ndarray) -> np.ndarray:
        """Improve contrast and sharpness for blurry or low-quality inputs."""
        try:
            image_rgb = img_array.astype(np.uint8)
            lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            enhanced = cv2.merge((l, a, b))
            enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB)

            blurred = cv2.GaussianBlur(enhanced, (0, 0), sigmaX=1.0)
            sharpened = cv2.addWeighted(enhanced, 1.5, blurred, -0.5, 0)
            return np.clip(sharpened, 0, 255).astype(np.uint8)
        except Exception as e:
            logger.warning(f"⚠️  Enhancement skipped due to error: {e}")
            return img_array

    def preprocess_image(self, image_path: str) -> Optional[np.ndarray]:
        """Advanced image preprocessing"""
        try:
            # Load image and resize to model input
            img = image.load_img(image_path, target_size=self.image_size)
            img_array = image.img_to_array(img)

            # Convert to RGB if needed
            if img_array.shape[-1] == 4:  # RGBA
                img_array = cv2.cvtColor(img_array.astype(np.uint8), cv2.COLOR_RGBA2RGB)

            # Enhance image quality for blurred or low-contrast inputs
            img_array = self.enhance_image(img_array)

            # Add batch dimension
            img_batch = np.expand_dims(img_array, axis=0)

            # Apply EfficientNet preprocessing
            img_batch = preprocess_input(img_batch)

            return img_batch

        except Exception as e:
            logger.error(f"❌ Error preprocessing image {image_path}: {e}")
            return None

    def extract_features(self, image_path: str) -> Optional[np.ndarray]:
        """Extract feature vector for similarity matching"""
        if self.feature_extractor is None:
            return None

        img_batch = self.preprocess_image(image_path)
        if img_batch is None:
            return None

        try:
            features = self.feature_extractor.predict(img_batch, verbose=0)
            return features.flatten()
        except Exception as e:
            logger.error(f"❌ Error extracting features: {e}")
            return None

    def calculate_realistic_confidence(self, predictions: np.ndarray) -> Dict:
        """Calculate realistic confidence with uncertainty analysis"""
        if len(predictions) == 0:
            return {'confidence': 0.0, 'uncertainty': 1.0, 'quality': 'unknown'}

        # Get top predictions
        sorted_indices = np.argsort(predictions[0])[::-1]
        top_probs = predictions[0][sorted_indices[:3]]

        # Primary confidence
        primary_confidence = float(top_probs[0])

        # Uncertainty calculation (entropy-like)
        if len(top_probs) > 1:
            # Normalize probabilities
            normalized_probs = top_probs / np.sum(top_probs)
            # Calculate entropy
            entropy = -np.sum(normalized_probs * np.log(normalized_probs + 1e-10))
            # Normalize entropy to 0-1 scale
            max_entropy = np.log(len(top_probs))
            uncertainty = entropy / max_entropy if max_entropy > 0 else 0
        else:
            uncertainty = 0.0

        # Confidence quality assessment
        if primary_confidence >= self.high_confidence_threshold and uncertainty < 0.3:
            quality = 'high'
        elif primary_confidence >= self.medium_confidence_threshold and uncertainty < 0.5:
            quality = 'medium'
        elif primary_confidence >= self.low_confidence_threshold:
            quality = 'low'
        else:
            quality = 'very_low'

        # Apply confidence calibration (reduce overconfidence)
        calibrated_confidence = self.calibrate_confidence(primary_confidence, uncertainty)

        return {
            'confidence': calibrated_confidence,
            'uncertainty': float(uncertainty),
            'quality': quality,
            'raw_confidence': primary_confidence
        }

    def calibrate_confidence(self, confidence: float, uncertainty: float) -> float:
        """Calibrate confidence to be more realistic"""
        # Reduce overconfidence for uncertain predictions
        if uncertainty > 0.5:
            # Apply stronger calibration for high uncertainty
            calibration_factor = 1 - (uncertainty - 0.5) * 0.5
            calibrated = confidence * calibration_factor
        elif uncertainty > 0.3:
            # Moderate calibration
            calibrated = confidence * 0.9
        else:
            # Slight calibration for confident predictions
            calibrated = confidence * 0.95

        return max(0.0, min(1.0, calibrated))

    def find_similar_patterns(self, query_features: np.ndarray, top_k: int = 5) -> List[Dict]:
        """Find similar batik patterns using feature similarity"""
        if query_features is None or not hasattr(self, 'reference_features'):
            return []

        try:
            # Calculate cosine similarity with reference patterns
            similarities = cosine_similarity([query_features], self.reference_features)[0]

            # Get top similar patterns
            top_indices = np.argsort(similarities)[::-1][:top_k]

            similar_patterns = []
            for idx in top_indices:
                if idx < len(self.labels):
                    similar_patterns.append({
                        'pattern': self.labels[idx],
                        'similarity': float(similarities[idx]),
                        'rank': len(similar_patterns) + 1
                    })

            return similar_patterns

        except Exception as e:
            logger.error(f"❌ Error finding similar patterns: {e}")
            return []

    def generate_prediction_message(self, confidence_info: Dict, top_predictions: List[Dict]) -> str:
        """Generate human-readable prediction message"""
        quality = confidence_info['quality']
        confidence = confidence_info['confidence']

        if quality == 'high':
            message = f"Saya yakin {confidence:.1%} ini adalah {top_predictions[0]['label']}"
        elif quality == 'medium':
            message = f"Saya rasa {confidence:.1%} ini adalah {top_predictions[0]['label']}"
        elif quality == 'low':
            message = f"Tidak yakin {confidence:.1%}, tapi kemungkinan ini adalah {top_predictions[0]['label']}"
            if len(top_predictions) > 1:
                alternatives = [f"{p['label']} ({p['confidence']:.1%})" for p in top_predictions[1:3]]
                message += f" Mungkin juga: {', '.join(alternatives)}"
        else:
            message = f"Pola tidak dikenali dengan baik {confidence:.1%}, tapi mirip dengan {top_predictions[0]['label']}"
            if len(top_predictions) > 1:
                alternatives = [f"{p['label']} ({p['confidence']:.1%})" for p in top_predictions[:3]]
                message += f" Pola serupa: {', '.join(alternatives)}"

        return message

    def predict_image(self, image_path: str) -> Dict:
        """Advanced image prediction with Google Lens-style features"""
        if self.model is None:
            return {
                'error': 'Model not loaded',
                'label': 'Unknown',
                'confidence': 0.0
            }

        # Preprocess image
        img_batch = self.preprocess_image(image_path)
        if img_batch is None:
            return {
                'error': 'Could not process image',
                'label': 'Unknown',
                'confidence': 0.0
            }

        try:
            # Get model predictions
            predictions = self.model.predict(img_batch, verbose=0)

            # Get top 5 predictions
            top_k = min(5, len(self.labels))
            top_indices = np.argsort(predictions[0])[::-1][:top_k]

            top_predictions = []
            for i, idx in enumerate(top_indices):
                top_predictions.append({
                    'label': self.labels[idx] if idx < len(self.labels) else f'Class_{idx}',
                    'confidence': float(predictions[0][idx]),
                    'rank': i + 1
                })

            # Calculate realistic confidence
            confidence_info = self.calculate_realistic_confidence(predictions)

            # Extract features for similarity
            query_features = self.extract_features(image_path)
            similar_patterns = self.find_similar_patterns(query_features, top_k=3)

            # Generate prediction message
            message = self.generate_prediction_message(confidence_info, top_predictions)

            # Build comprehensive result
            result = {
                'label': top_predictions[0]['label'],
                'confidence': confidence_info['confidence'],
                'quality': confidence_info['quality'],
                'uncertainty': confidence_info['uncertainty'],
                'message': message,
                'top_predictions': top_predictions,
                'similar_patterns': similar_patterns,
                'metadata': {
                    'model_version': 'EfficientNetB3_Advanced',
                    'image_size': self.image_size,
                    'num_classes': len(self.labels),
                    'confidence_thresholds': {
                        'high': self.high_confidence_threshold,
                        'medium': self.medium_confidence_threshold,
                        'low': self.low_confidence_threshold
                    }
                }
            }

            # Log prediction for analytics
            self.log_prediction(result, image_path)

            return result

        except Exception as e:
            logger.error(f"❌ Prediction error: {e}")
            return {
                'error': str(e),
                'label': 'Error',
                'confidence': 0.0
            }

    def log_prediction(self, result: Dict, image_path: str):
        """Log prediction for analytics"""
        try:
            log_entry = {
                'timestamp': str(np.datetime64('now')),
                'image_path': str(image_path),
                'prediction': result.get('label', 'Unknown'),
                'confidence': result.get('confidence', 0.0),
                'quality': result.get('quality', 'unknown'),
                'uncertainty': result.get('uncertainty', 0.0),
                'top_predictions': result.get('top_predictions', [])
            }

            # Save to predictions log in a consistent location
            log_file = Path('models/prediction_log.jsonl')
            log_file.parent.mkdir(exist_ok=True)

            with open(log_file, 'a', encoding='utf-8') as f:
                json.dump(log_entry, f, ensure_ascii=False)
                f.write('\n')

        except Exception as e:
            logger.warning(f"⚠️  Could not log prediction: {e}")

    def get_prediction_analytics(self, limit: int = 1000) -> Dict:
        """Get prediction analytics from logs"""
        try:
            log_file = Path('models/prediction_log.jsonl')
            if not log_file.exists():
                log_file = Path('prediction_log.jsonl')

            if not log_file.exists():
                return {
                    'total_predictions': 0,
                    'average_confidence': 0.0,
                    'confidence_std': 0.0,
                    'quality_distribution': {},
                    'label_distribution': {},
                    'confidence_histogram': []
                }

            predictions = []
            with open(log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        predictions.append(json.loads(line))

            # Limit to recent predictions
            predictions = predictions[-limit:]

            # Calculate analytics
            total_predictions = len(predictions)
            confidence_scores = [p['confidence'] for p in predictions]
            quality_counts = {}
            label_counts = {}

            for p in predictions:
                quality = p.get('quality', 'unknown')
                label = p.get('label', 'Unknown')

                quality_counts[quality] = quality_counts.get(quality, 0) + 1
                label_counts[label] = label_counts.get(label, 0) + 1

            analytics = {
                'total_predictions': total_predictions,
                'average_confidence': float(np.mean(confidence_scores)) if confidence_scores else 0.0,
                'confidence_std': float(np.std(confidence_scores)) if confidence_scores else 0.0,
                'quality_distribution': quality_counts,
                'label_distribution': label_counts,
                'confidence_histogram': np.histogram(confidence_scores, bins=10, range=(0, 1))[0].tolist() if confidence_scores else []
            }

            return analytics

        except Exception as e:
            logger.error(f"❌ Error getting analytics: {e}")
            return {'error': str(e)}

# Global inference instance
inference_engine = None

def get_inference_engine():
    """Get or create inference engine singleton"""
    global inference_engine
    if inference_engine is None:
        inference_engine = AdvancedBatikInference()
    return inference_engine

def predict_batik_image(image_path: str) -> Dict:
    """Convenience function for batik prediction"""
    engine = get_inference_engine()
    return engine.predict_image(image_path)

if __name__ == '__main__':
    # Test inference
    engine = AdvancedBatikInference()

    # Test with sample image if available
    test_image = 'data/train/Batik Papua/1778738529522-6e3a86f5-a783-419d-b6c3-7cf899b55657.jpg'
    if os.path.exists(test_image):
        result = engine.predict_image(test_image)
        print("🧪 Test Prediction Result:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("⚠️  No test image found")

    # Show analytics
    analytics = engine.get_prediction_analytics()
    print("\n📊 Prediction Analytics:")
    print(json.dumps(analytics, indent=2, ensure_ascii=False))