import React, { useState } from 'react';
import { ExternalLink, Download, Copy, CheckCircle2 } from 'lucide-react';
import BatikCultureDetail from './BatikCultureDetail';
import BilingualText from './BilingualText';

const safeBase64Encode = (value) => {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary);
};

const getShareableResultUrl = (result, payload) => {
  const encoded = encodeURIComponent(safeBase64Encode(JSON.stringify(payload)));
  return `${window.location.origin}/result?payload=${encoded}`;
};

const ActionButton = ({ icon: Icon, label, onClick, variant = 'primary', disabled = false }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-2px] ${variants[variant]} min-h-[44px] touch-manipulation`}
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
};

const Toast = ({ message, show, type = 'success' }) => {
  if (!show) return null;
  const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <div className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 ${bgColor} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-2 animate-slideUp z-40`}>
      <CheckCircle2 className="w-5 h-5" />
      <span className="text-sm sm:text-base font-semibold">{message}</span>
    </div>
  );
};

export default function PredictionResult({ result }) {
  const [modalSrc, setModalSrc] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  if (!result) {
    return null;
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const getScore = (r) => {
    if (!r) return null;
    if (r.confidence_score != null) return Number(r.confidence_score);
    if (r.confidence != null) return Number(r.confidence);
    if (r.confidence_score_pct != null) return Number(r.confidence_score_pct) / 100;
    return null;
  };

  const score = getScore(result);
  const confidence = score != null ? (score * 100).toFixed(2) : 'N/A';
  const isHighConfidence = score != null && score >= 0.8;
  const isMediumConfidence = score != null && score >= 0.6;

  const getConfidenceColor = () => {
    if (isHighConfidence) return 'from-green-500 to-emerald-500';
    if (isMediumConfidence) return 'from-yellow-500 to-amber-500';
    return 'from-red-500 to-rose-500';
  };

  const modelVersion = result.model_version || result.modelVersion || 'v2.0';
  const inferenceTime = result.inference_time ?? result.prediction_time ?? result.latency ?? null;
  const imageUrl = result.image_url || result.image || result.image_path || null;

  const getConfidenceLabel = () => {
    if (isHighConfidence) return 'Sangat Yakin';
    if (isMediumConfidence) return 'Cukup Yakin';
    if (score != null) return 'Kurang Yakin';
    return 'N/A';
  };

  const getConfidenceLabelEn = () => {
    if (isHighConfidence) return 'Very Confident';
    if (isMediumConfidence) return 'Moderately Confident';
    if (score != null) return 'Less Confident';
    return 'N/A';
  };

  const confidenceBadgeColor = score == null ? 'bg-slate-100 text-slate-600' : isHighConfidence ? 'bg-emerald-100 text-emerald-700' : isMediumConfidence ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';

  // Action handlers
  const handleOpenImage = () => {
    const imageUrl = result.image_url || result.image || result.image_path;
    if (imageUrl) {
      setModalSrc(imageUrl);
    }
  };

  const handleDownloadImage = async () => {
    const imageUrl = result.image_url || result.image || result.image_path;
    if (!imageUrl) {
      showToast('Gambar tidak tersedia untuk diunduh / Image unavailable for download', 'error');
      return;
    }

    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error('Gagal mengunduh gambar / Failed to download image');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const fileExt = imageUrl.split('.').pop().split('?')[0] || 'jpg';
      link.download = `batik-${result.prediction_label}-${Date.now()}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      showToast('Gambar berhasil diunduh / Image downloaded successfully', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Gagal mengunduh gambar / Failed to download image', 'error');
    }
  };

  const handleCopyLink = async () => {
    try {
      // Validasi image_url tersedia
      const imageUrl = result.image_url || result.image || result.image_path;
      
      if (!imageUrl) {
        showToast('Gambar tidak tersedia untuk dibagikan / Image unavailable to share', 'error');
        return;
      }

      // Struktur payload yang akan di-share
      const payload = {
        prediction_label: result.prediction_label || 'Tidak Terdeteksi',
        confidence_score: score,
        model_version: modelVersion,
        image_url: imageUrl,
        top_predictions: result.top_predictions || [],
        created_at: result.created_at || new Date().toISOString(),
      };
      
      // Generate share URL
      const shareUrl = getShareableResultUrl(result, payload);

      // ONLY copy the URL, nothing else
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link berhasil disalin ke clipboard! 📋 / Link copied to clipboard!', 'success');
    } catch (err) {
      console.error('Copy error:', err);
      showToast('Gagal menyalin link / Failed to copy link', 'error');
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 animate-slideUp">
      <div className="card-shell surface p-5 sm:p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <BilingualText
              className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold"
              translation="Classification Result"
            >
              Hasil Klasifikasi
            </BilingualText>
            <h3 className="mt-3 text-3xl sm:text-4xl font-semibold text-slate-950 leading-tight break-words">{result.prediction_label}</h3>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${confidenceBadgeColor}`}>{getConfidenceLabel()}</span>
        </div>
        <BilingualText
          className="mt-3 text-sm text-slate-500"
          translation="Traditional South Sumatra batik motif"
        >
          Motif batik Sumatera Selatan
        </BilingualText>
        <div className="mt-4 flex flex-wrap gap-3 text-xs sm:text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-2">Model: {modelVersion}</span>
          {inferenceTime != null && <span className="rounded-full bg-slate-100 px-3 py-2">Latensi: {inferenceTime} ms</span>}
          <span className="rounded-full bg-slate-100 px-3 py-2">Kepercayaan: {confidence}%</span>
        </div>
      </div>

      <div className="card-shell surface p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BilingualText
              className="text-xs text-slate-500 font-semibold uppercase tracking-[0.24em]"
              translation="Confidence Level"
            >
              Tingkat Kepercayaan
            </BilingualText>
            <p className="mt-3 text-3xl sm:text-4xl font-semibold text-slate-950">{confidence}%</p>
            <BilingualText
              className="mt-2 text-sm text-slate-500"
              translation={`Status: ${getConfidenceLabelEn()}`}
            >
              Status: {getConfidenceLabel()}
            </BilingualText>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-3xl text-slate-900 shadow-sm">
            {isHighConfidence ? '✓' : isMediumConfidence ? '◐' : '!' }
          </div>
        </div>
        <div className="mt-6 progress-track">
          <div className="progress-fill" style={{ width: score != null ? `${confidence}%` : '6%' }} />
        </div>
      </div>

      {/* Batik Culture Detail Section */}
      <BatikCultureDetail batikName={result.prediction_label} />

      {/* Top predictions */}
      {result.top_predictions && result.top_predictions.length > 0 && (
        <div className="card-shell surface p-5 sm:p-6 shadow-lg">
          <BilingualText
            className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold"
            translation="Top Predictions"
          >
            Top Prediksi
          </BilingualText>
          <div className="mt-3 space-y-3">
            {result.top_predictions.slice(0, 3).map((p, idx) => {
              const s = getScore(p) ?? (p.confidence != null ? Number(p.confidence) : null);
              const pct = s != null ? Math.round(s * 100) : 'N/A';
              const color = s == null ? 'bg-slate-200' : (s >= 0.8 ? 'from-green-400 to-emerald-500' : s >= 0.6 ? 'from-yellow-400 to-amber-400' : 'from-rose-400 to-rose-600');
              return (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 truncate">{p.label || p.prediction || p.class || 'Unknown'}</p>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${s != null ? 'bg-gradient-to-r ' + color : 'bg-slate-200'}`} style={{ width: s != null ? `${pct}%` : '6%' }} />
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm text-slate-700 font-semibold">{s != null ? `${pct}%` : 'N/A'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Redesigned Actions Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div className="card-shell surface p-5 sm:p-6 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl sm:text-2xl">📸</span>
            <div>
              <BilingualText
                className="text-sm sm:text-base font-semibold text-slate-900"
                translation="Image"
              >
                Gambar
              </BilingualText>
              <BilingualText
                className="text-xs text-slate-500"
                translation="Open photo in full size"
              >
                Buka foto dalam ukuran penuh
              </BilingualText>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square mb-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={result.prediction_label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3EGambar tidak dapat dimuat%3C/text%3E%3C/svg%3E';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <p className="text-slate-400 text-center">Gambar tidak tersedia</p>
              </div>
            )}
          </div>

          <div className="mt-auto">
            <ActionButton
              icon={ExternalLink}
              label="Buka"
              onClick={handleOpenImage}
              variant="primary"
            />
            <BilingualText
              className="text-xs text-slate-500 mt-3"
              translation="Tap to view the image at full size"
            >
              Ketuk untuk melihat gambar dalam ukuran penuh
            </BilingualText>
          </div>
        </div>

        <div className="card-shell surface p-5 sm:p-6 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl sm:text-2xl">📤</span>
              <div>
                <BilingualText
                  className="text-sm sm:text-base font-semibold text-slate-900"
                  translation="Download & Share"
                >
                  Unduh & Bagikan
                </BilingualText>
                <BilingualText
                  className="text-xs text-slate-500"
                  translation="Save or share the result"
                >
                  Simpan atau bagikan hasil
                </BilingualText>
              </div>
            </div>
            <div className="space-y-3">
              <ActionButton
                icon={Download}
                label="Unduh Gambar"
                onClick={handleDownloadImage}
                variant="primary"
              />
              <ActionButton
                icon={Copy}
                label="Salin Link"
                onClick={handleCopyLink}
                variant="secondary"
              />
            </div>
          </div>
          <BilingualText
            className="text-xs text-slate-500 mt-6"
            translation="The URL is ready to share with friends"
          >
            URL siap untuk dibagikan ke teman
          </BilingualText>
        </div>
      </div>

      {/* Modal preview */}
      {modalSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setModalSrc(null)}>
          <button
            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-slate-100 transition-colors"
            onClick={() => setModalSrc(null)}
          >
            <span className="text-2xl">✕</span>
          </button>
          <div className="max-w-[90%] max-h-[90vh] flex items-center justify-center">
            <img src={modalSrc} alt="preview" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-shell surface p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">📅</span>
            <BilingualText
              className="text-sm font-semibold text-slate-700"
              translation="Analysis Date"
            >
              Tanggal Analisis
            </BilingualText>
          </div>
          <p className="text-slate-950 font-semibold text-base break-words">
            {new Date(result.created_at).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="mt-1 text-sm text-slate-500">{new Date(result.created_at).toLocaleTimeString('id-ID')}</p>
        </div>

        <div className="card-shell surface p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">🎯</span>
            <BilingualText
              className="text-sm font-semibold text-slate-700"
              translation="Model Accuracy"
            >
              Akurasi Model
            </BilingualText>
          </div>
          <p className="text-slate-950 font-semibold text-base">{score != null ? `${(score * 100).toFixed(1)}%` : 'N/A'}</p>
          <p className="mt-1 text-sm text-slate-500">Prediksi ML Model</p>
        </div>
      </div>

      {result.low_confidence && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div className="flex gap-3 items-start">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-slate-950">Peringatan: Confidence Rendah</p>
              <p className="mt-1 text-sm text-slate-600">{result.warning_message || 'Hasil klasifikasi mungkin kurang akurat. Silakan gunakan gambar dengan kualitas lebih baik.'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card-shell surface p-5 sm:p-6 shadow-lg">
        <div className="flex gap-3 items-start mb-3">
          <span className="text-2xl">💡</span>
          <div>
            <BilingualText
              as="p"
              className="text-sm font-semibold text-slate-950"
              translation="Batik Photo Tips"
            >
              Tips Foto Batik
            </BilingualText>
            <BilingualText
              className="mt-1 text-sm text-slate-600"
              translation="Focus on the batik pattern, avoid shadows, and take photos from close range for the best results."
            >
              Fokus pada pola batik, hindari bayangan, dan ambil dari jarak dekat untuk hasil terbaik.
            </BilingualText>
          </div>
        </div>
        <ul className="space-y-3 text-sm text-slate-600">
          <li>
            <BilingualText
              className="leading-relaxed"
              translation="Make sure the batik motif is clear and not cropped."
            >
              • Pastikan motif batik terlihat jelas dan tidak terpotong.
            </BilingualText>
          </li>
          <li>
            <BilingualText
              className="leading-relaxed"
              translation="Use natural lighting and minimize reflections."
            >
              • Gunakan pencahayaan natural dan minimalkan pantulan.
            </BilingualText>
          </li>
          <li>
            <BilingualText
              className="leading-relaxed"
              translation="Avoid busy backgrounds so the AI can focus better."
            >
              • Hindari latar belakang yang ramai agar AI lebih fokus.
            </BilingualText>
          </li>
        </ul>
      </div>

      <div className="card-shell surface p-5 sm:p-6 shadow-lg">
        <div className="flex gap-3 items-start">
          <span className="text-2xl">ℹ️</span>
          <div>
            <BilingualText
              as="p"
              className="text-sm font-semibold text-slate-950 mb-2"
              translation={`About Batik ${result.prediction_label}`}
            >
              Tentang Batik {result.prediction_label}
            </BilingualText>
            <BilingualText
              className="text-sm leading-relaxed text-slate-600"
              translation={`Batik ${result.prediction_label} is a traditional South Sumatra batik motif rich in cultural meaning. It is commonly used in regional batik crafts and carries a distinctive traditional pattern.`}
            >
              Batik {result.prediction_label} merupakan motif tradisional Sumatera Selatan yang kaya akan makna budaya. Motif ini umumnya digunakan dalam kerajinan batik daerah dan memiliki ciri khas pola tradisional yang estetis.
            </BilingualText>
          </div>
        </div>
      </div>



      <Toast show={toast.show} message={toast.message} type={toast.type} />

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }

        .animate-pulse-slow {
          animation: pulseSlow 2s ease-in-out infinite;
        }

        /* Better typography scaling */
        @media (max-width: 640px) {
          h3 {
            word-break: break-word;
          }
        }

        /* Responsive text sizes */
        @media (max-width: 640px) {
          .text-xs {
            font-size: 0.75rem;
          }
          .text-sm {
            font-size: 0.875rem;
          }
        }

        /* Touch optimization */
        @supports (padding: max(0px)) {
          button {
            padding-top: max(0.625rem, calc(0.625rem + env(safe-area-inset-top)));
            padding-bottom: max(0.625rem, calc(0.625rem + env(safe-area-inset-bottom)));
          }
        }
      `}</style>
    </div>
  );
}

