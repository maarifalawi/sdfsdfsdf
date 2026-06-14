# Batik Klasifikasi Sumatera Selatan

Satu dokumentasi utama untuk seluruh proyek.

## Ringkasan Proyek

Proyek ini adalah aplikasi klasifikasi batik Sumatera Selatan dengan arsitektur full-stack:
- `frontend/` : aplikasi React + Vite + Tailwind untuk UI pengguna.
- `backend/` : API Express.js untuk otentikasi, upload gambar, dan komunikasi dengan ML service.
- `ml_service/` : layanan FastAPI untuk training model TensorFlow, inferensi gambar, evaluasi, dan heatmap.

## Struktur Utama

- `/frontend` : sumber frontend React.
- `/backend` : sumber API backend Node.js.
- `/ml_service` : layanan machine learning Python.
- `/ml_service/data/train` : dataset training terstruktur menurut label.
- `/ml_service/models` : model dan hasil evaluasi tersimpan.
- `/ml_service/heatmaps` : hasil heatmap explainability.

## Fitur Utama

- Klasifikasi gambar batik dengan model TensorFlow.
- Endpoint prediksi dan heatmap untuk visualisasi hasil.
- Endpoint analitik dan histori training.
- Integrasi backend dengan Supabase untuk data dan otentikasi admin.
- UI admin/dashboard untuk manajemen dan prediksi.

## Setup Lingkungan

### 1. Backend

```powershell
cd backend
npm install
copy .env.example .env
```

**Catatan:**
- Frontend akan berjalan di `http://localhost:5173`
- Setiap perubahan file React/CSS akan langsung ter-reload di browser (HMR) tanpa perlu refresh manual
- Proxy API otomatis ke backend di `http://127.0.0.1:5000`
- Pastikan ketiga service (ML, Backend, Frontend) semua berjalan untuk aplikasi berfungsi penuh


Edit `backend/.env` dengan konfigurasi berikut:
- `ML_SERVICE_URL=http://127.0.0.1:8000`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### 2. Frontend

```powershell
cd frontend
npm install
```

### 3. ML Service

```powershell
cd ml_service
python -m venv .\venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Menjalankan Aplikasi

1. Jalankan ML service:

```powershell
cd ml_service
.\venv\Scripts\Activate.ps1
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

2. Jalankan backend:

```powershell
cd backend
npm run start
```

3. Jalankan frontend:

```powershell
cd frontend
npm run dev
```

## Endpoint Penting

### ML Service
- `GET /analytics` : statistik prediksi dan ringkasan.
- `GET /training-history` : histori training.
- `GET /evaluation` : hasil evaluasi model.
- `GET /model-metrics` : metrik performa.
- `GET /evaluate` : evaluasi dataset pada model.
- `POST /predict` : prediksi gambar.
- `POST /generate-heatmap` : hasil heatmap explainability.

### Backend
- `POST /api/predictions` : upload gambar untuk klasifikasi lewat backend.
- `POST /api/admin/train` : aktifkan training model lewat backend.
- `GET /api/ml/analytics` : data analitik dari ML service.
- `GET /api/ml/training-history` : histori training lewat backend.
- `GET /api/ml/evaluation` : hasil evaluasi lewat backend.

## Aturan Dataset

- Dataset training disimpan di `ml_service/data/train/<label>/`.
- Setiap label batik disimpan dalam folder terpisah.
- Minimal beberapa gambar per label agar model dapat belajar.

## Catatan Penting

- Pastikan `ml_service` berjalan sebelum backend atau frontend mengirim permintaan inferensi.
- Backend harus terhubung ke alamat ML service di `.env`.
- `ml_service` memakai FastAPI dan TensorFlow, sehingga model dan data harus bisa diakses dari folder `ml_service`.

## Keterangan Teknis

### Backend
- Express.js dengan middleware untuk CORS, upload file, dan Supabase.
- Menggunakan `axios`, `bcrypt`, `jsonwebtoken`, `multer`, `uuid`.

### Frontend
- Dibangun dengan React + Vite + Tailwind.
- Menggunakan `axios`, `react-router-dom`, `chart.js`, `react-chartjs-2`.

### ML Service
- FastAPI dengan endpoint training, prediksi, evaluasi, dan heatmap.
- Model TensorFlow disimpan di `ml_service/models/model.h5`.
- Hasil evaluasi disimpan di `ml_service/metrics.json` dan `ml_service/training_history.json`.

## Login Demo Admin

- Email: `admin@example.com`
- Password: `admin123`

## Catatan Akhir

File Markdown lainnya telah dihapus untuk menjaga dokumentasi hanya dalam satu file utama: `README.md`.
