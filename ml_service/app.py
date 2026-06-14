import os
import shutil
import tempfile
import json
import time
import threading
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import traceback
from fastapi.responses import JSONResponse
from supabase import create_client
from dotenv import load_dotenv
import requests
from inference import get_inference_engine
from evaluate import evaluate_dataset
from explainability import generate_heatmap_overlay
from model import train_model, MODEL_PATH

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / os.getenv('ML_DATA_DIR', 'data')
TRAIN_DIR = DATA_DIR / 'train'
TRAIN_DIR.mkdir(parents=True, exist_ok=True)

TRAINING_HISTORY_PATH = BASE_DIR / 'training_history.json'
TRAINING_STATUS_PATH = BASE_DIR / 'training_status.json'
MODEL_METRICS_PATH = BASE_DIR / 'metrics.json'
EVALUATION_RESULTS_PATH = BASE_DIR / 'models' / 'evaluation_results.json'

app = FastAPI(title='Batik Sumsel ML Service')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

HEATMAP_DIR = BASE_DIR / 'heatmaps'
HEATMAP_DIR.mkdir(parents=True, exist_ok=True)
app.mount('/heatmaps', StaticFiles(directory=str(HEATMAP_DIR)), name='heatmaps')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')

SUPABASE_CLIENT = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
) if SUPABASE_URL and SUPABASE_KEY else None

TRAINING_LOCK = threading.Lock()


def download_dataset_from_supabase(target_dir):
    if not SUPABASE_CLIENT:
        raise RuntimeError('Supabase client tidak terkonfigurasi.')
    os.makedirs(target_dir, exist_ok=True)
    result = SUPABASE_CLIENT.table('datasets').select('image_url,label').execute()
    
    data = result.data if hasattr(result, 'data') else result
    for item in data:
        label = item['label']
        url = item['image_url']
        label_dir = os.path.join(target_dir, label)
        os.makedirs(label_dir, exist_ok=True)
        try:
            resp = requests.get(url, timeout=30)
            if resp.status_code == 200:
                image_name = os.path.basename(url.split('?')[0]) or f'{label}.jpg'
                with open(os.path.join(label_dir, image_name), 'wb') as f:
                    f.write(resp.content)
        except Exception:
            continue


@app.get('/analytics')
async def get_analytics():
    """Get prediction analytics"""
    try:
        engine = get_inference_engine()
        analytics = engine.get_prediction_analytics()
        return JSONResponse(analytics)
    except Exception as exc:
        logging.error('Analytics error:', exc)
        raise HTTPException(status_code=500, detail=f'Gagal mendapatkan analytics: {str(exc)}')


@app.get('/training-history')
async def get_training_history():
    """Get training history"""
    try:
        history_path = TRAINING_HISTORY_PATH
        if os.path.exists(history_path):
            with open(history_path, 'r', encoding='utf-8') as f:
                history = json.load(f)
            return JSONResponse(history)
        else:
            return JSONResponse({'error': 'Training history not found'})
    except Exception as exc:
        logging.error('Training history error:', exc)
        raise HTTPException(status_code=500, detail=f'Gagal mendapatkan training history: {str(exc)}')


@app.get('/evaluation')
async def get_evaluation():
    """Get model evaluation results"""
    try:
        eval_path = EVALUATION_RESULTS_PATH
        if os.path.exists(eval_path):
            with open(eval_path, 'r') as f:
                evaluation = json.load(f)
            return JSONResponse(evaluation)
        else:
            return JSONResponse({'error': 'Evaluation results not found'})
    except Exception as exc:
        logging.error('Evaluation error:', exc)
        raise HTTPException(status_code=500, detail=f'Gagal mendapatkan evaluation: {str(exc)}')


@app.get('/model-metrics')
async def get_model_metrics():
    """Get model performance metrics"""
    try:
        metrics_path = MODEL_METRICS_PATH
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r', encoding='utf-8') as f:
                metrics = json.load(f)
            return JSONResponse(metrics)
        else:
            return JSONResponse({'error': 'Model metrics not found'})
    except Exception as exc:
        logging.error('Model metrics error:', exc)
        raise HTTPException(status_code=500, detail=f'Gagal mendapatkan model metrics: {str(exc)}')


@app.get('/evaluate')
async def evaluate():
    try:
        report = evaluate_dataset(DATA_DIR, MODEL_PATH)
        return JSONResponse(report)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logging.error('Evaluation error:', exc)
        raise HTTPException(status_code=500, detail=f'Gagal melakukan evaluasi: {str(exc)}')


@app.post('/predict')
async def predict(image: UploadFile = File(...)):
    if image.content_type.split('/')[0] != 'image':
        raise HTTPException(status_code=400, detail='File harus berupa gambar.')

    temp_dir = tempfile.mkdtemp()
    try:
        path = os.path.join(temp_dir, image.filename)
        with open(path, 'wb') as buffer:
            buffer.write(await image.read())

        # Use advanced inference engine
        engine = get_inference_engine()
        result = engine.predict_image(path)

        return JSONResponse(result)
    except Exception as exc:
        logging.error('Prediction error:', exc)
        raise HTTPException(status_code=500, detail=f'Gagal melakukan prediksi: {str(exc)}')
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.post('/generate-heatmap')
async def generate_heatmap(request: Request, image: UploadFile = File(...)):
    if image.content_type.split('/')[0] != 'image':
        raise HTTPException(status_code=400, detail='File harus berupa gambar.')

    temp_dir = tempfile.mkdtemp()
    try:
        path = os.path.join(temp_dir, image.filename)
        with open(path, 'wb') as buffer:
            buffer.write(await image.read())

        engine = get_inference_engine()
        if engine.model is None:
            raise HTTPException(status_code=500, detail='Model belum dimuat.')

        prediction = engine.predict_image(path)
        confidence = float(prediction.get('confidence', 0.0))
        label = prediction.get('label', 'Unknown')

        show_heatmap = False
        heatmap_url = None

        if confidence >= 0.70:
            try:
                heatmap_path, _ = generate_heatmap_overlay(engine.model, path, target_size=engine.image_size)
                base_url = str(request.base_url).rstrip('/')
                heatmap_url = f"{base_url}/heatmaps/{os.path.basename(heatmap_path)}"
                show_heatmap = True
            except Exception as exc:
                logger.warning('Heatmap generation failed: %s', exc)
                show_heatmap = False

        response_payload = {
            'prediction_label': label,
            'confidence_score': confidence,
            'show_heatmap': show_heatmap,
            'heatmap_url': heatmap_url,
        }

        return JSONResponse(response_payload)
    except HTTPException:
        raise
    except Exception as exc:
        logging.error('Heatmap error:', exc)
        raise HTTPException(status_code=500, detail=f'Gagal menghasilkan heatmap: {str(exc)}')
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.post('/train')
async def train():
    try:
        train_dir = str(DATA_DIR / 'train')
        logger.info(f"Training directory: {train_dir}")


        if not SUPABASE_CLIENT:
            logger.info("Supabase tidak terkonfigurasi, menggunakan data lokal yang ada.")
            if not os.path.isdir(train_dir) or not any(os.scandir(train_dir)):
                raise HTTPException(status_code=400, detail="Dataset lokal tidak tersedia dan Supabase tidak terkonfigurasi.")

        if not TRAINING_LOCK.acquire(blocking=False):
            raise HTTPException(status_code=409, detail='Training sedang berjalan. Silakan cek /training-status.')

        def background_train():
            try:
                logger.info('Background training dimulai.')

                if SUPABASE_CLIENT:
                    logger.info('Sinkronisasi dataset dari Supabase sebelum training...')
                    if os.path.exists(train_dir):
                        shutil.rmtree(train_dir)
                    os.makedirs(train_dir, exist_ok=True)
                    download_dataset_from_supabase(train_dir)

                metrics, labels = train_model(DATA_DIR)
                logger.info(f'Background training selesai. Metrics: {metrics}')
            except Exception as exc:
                logger.error('Background training error:', exc, exc_info=True)
            finally:
                TRAINING_LOCK.release()

        training_thread = threading.Thread(target=background_train, daemon=True)
        training_thread.start()

        return JSONResponse(status_code=202, content={
            'success': True,
            'message': 'Training dimulai di background. Pantau status di /training-status.',
        })
    except FileNotFoundError as exc:
        logger.error(f"File tidak ditemukan: {exc}", exc_info=True)
        raise HTTPException(status_code=404, detail=f"File error: {str(exc)}")
    except ValueError as exc:
        logger.error(f"Validation Error: {exc}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Validation error: {str(exc)}")
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Training Error: {exc}", exc_info=True)
        error_detail = f'Gagal training: {str(exc)}'
        raise HTTPException(status_code=500, detail=error_detail)


@app.get('/training-status')
async def get_training_status():
    """Get current training status"""
    try:
        status_path = TRAINING_STATUS_PATH
        if os.path.exists(status_path):
            with open(status_path, 'r', encoding='utf-8') as f:
                status = json.load(f)
            return JSONResponse(status)
        if TRAINING_LOCK.locked():
            return JSONResponse({'state': 'running', 'progress': 0, 'log': 'Training sedang dimulai...'})
        return JSONResponse({'state': 'idle', 'progress': 0})
    except Exception as exc:
        logger.error('Training status error:', exc)
        raise HTTPException(status_code=500, detail=f'Gagal mendapatkan training status: {str(exc)}')
