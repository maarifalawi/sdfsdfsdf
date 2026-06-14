import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BatikCultureDetail from '../components/BatikCultureDetail';
import BilingualText from '../components/BilingualText';

const safeDecode = (value) => {
  try {
    const bytes = Uint8Array.from(atob(decodeURIComponent(value)), (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (error) {
    return null;
  }
};

export default function ResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const payload = searchParams.get('payload');

  const result = useMemo(() => {
    if (!payload) return null;
    const raw = safeDecode(payload);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return {
        prediction_label: parsed.prediction_label,
        confidence_score: parsed.confidence_score,
        model_version: parsed.model_version || 'v2.0',
        image_url: parsed.image_url,
        image: parsed.image_url, // Fallback
        image_path: parsed.image_url, // Fallback
        top_predictions: parsed.top_predictions || [],
        created_at: parsed.created_at || new Date().toISOString(),
        confidence: parsed.confidence_score,
        confidence_score_pct: (parsed.confidence_score * 100),
      };
    } catch (error) {
      console.error('Error decoding result:', error);
      return null;
    }
  }, [payload]);

  return (
    <main className="bg-gradient-to-b from-white to-slate-50 min-h-screen w-full overflow-x-hidden py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex flex-col items-start gap-1 mb-8 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
        >
          <BilingualText
            as="span"
            className="text-sm font-semibold text-slate-700"
            translation="Back to Home"
          >
            ← Kembali ke Beranda
          </BilingualText>
        </button>

        {result ? (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-8 shadow-md">
              <BilingualText
                className="text-xs uppercase tracking-[0.32em] text-blue-600 font-semibold"
                translation="Shared Classification Result"
              >
                Hasil Klasifikasi Dibagikan
              </BilingualText>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
                {result.prediction_label}
              </h1>
              <BilingualText
                className="mt-4 text-base sm:text-lg text-slate-700"
                translation="Traditional South Sumatra batik motif"
              >
                Motif batik tradisional Sumatera Selatan
              </BilingualText>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Image Column */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <div className="rounded-3xl overflow-hidden border-2 border-slate-200 shadow-lg bg-slate-100 aspect-square">
                  {result.image_url ? (
                    <img 
                      src={result.image_url} 
                      alt={result.prediction_label} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3EGambar tidak dapat dimuat%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
                      <p className="text-slate-400 text-center">Gambar tidak tersedia</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Results Column */}
              <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
                {/* Confidence Card */}
                <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-md">
                  <BilingualText
                    className="text-xs uppercase tracking-[0.32em] text-blue-600 font-semibold"
                    translation="Confidence Level"
                  >
                    Tingkat Kepercayaan
                  </BilingualText>
                  <div className="flex items-end gap-6 mt-4">
                    <div>
                      <p className="text-5xl sm:text-6xl font-black text-slate-900">
                        {result.confidence_score != null ? Math.round(result.confidence_score * 100) : 'N/A'}%
                      </p>
                      <p className="text-slate-600 mt-2 text-sm">
                        {result.confidence_score >= 0.8 ? '✨ Sangat Yakin' : result.confidence_score >= 0.6 ? '◐ Cukup Yakin' : '⚠️ Kurang Yakin'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-6 space-y-2">
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          result.confidence_score >= 0.8 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                          result.confidence_score >= 0.6 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                          'bg-gradient-to-r from-rose-500 to-red-400'
                        }`}
                        style={{ width: `${result.confidence_score * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">Akurasi prediksi model</p>
                  </div>
                </div>

                {/* Model Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
                    <BilingualText
                    className="text-xs uppercase tracking-[0.24em] text-blue-600 font-semibold"
                    translation="Model"
                  >
                    Model
                  </BilingualText>
                    <p className="mt-2 text-lg font-bold text-slate-900">{result.model_version || 'v2.0'}</p>
                  </div>
                  <div className="rounded-2xl bg-cyan-50 border border-cyan-200 p-4">
                    <BilingualText
                      className="text-xs uppercase tracking-[0.24em] text-cyan-600 font-semibold"
                      translation="Time"
                    >
                      Waktu
                    </BilingualText>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {new Date(result.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Batik Culture Detail Section */}
            <BatikCultureDetail batikName={result.prediction_label} />

            {/* Top Predictions */}
            {result.top_predictions && result.top_predictions.length > 0 && (
              <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-md">
                <p className="text-xs uppercase tracking-[0.32em] text-blue-600 font-semibold">Top Prediksi</p>
                <div className="mt-6 space-y-4">
                  {result.top_predictions.slice(0, 3).map((pred, idx) => {
                    const conf = pred.confidence_score != null ? pred.confidence_score : 
                                 pred.confidence != null ? pred.confidence : 0;
                    const pct = Math.round(conf * 100);
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm sm:text-base font-semibold text-slate-800">
                            {idx + 1}. {pred.label || pred.prediction || 'Unknown'}
                          </p>
                          <p className="text-sm font-bold text-slate-700">{pct}%</p>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${
                              conf >= 0.8 ? 'from-emerald-500 to-green-400' :
                              conf >= 0.6 ? 'from-blue-500 to-cyan-400' :
                              'from-slate-300 to-slate-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tips Section */}
            <div className="rounded-3xl bg-blue-50 border border-blue-200 p-8">
              <div className="flex gap-4">
                <span className="text-2xl flex-shrink-0">💡</span>
                <div>
                  <BilingualText
                    className="text-sm font-semibold text-blue-900 mb-2"
                    translation="Tips for Best Batik Photos"
                  >
                    Tips untuk Foto Batik Terbaik
                  </BilingualText>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Pastikan motif batik terlihat jelas dan tidak terpotong</li>
                    <li className="text-xs text-blue-600">• Make sure the batik motif is clear and not cropped</li>
                    <li>• Gunakan pencahayaan natural dan minimalkan pantulan</li>
                    <li className="text-xs text-blue-600">• Use natural lighting and minimize reflections</li>
                    <li>• Hindari latar belakang yang ramai agar AI lebih fokus</li>
                    <li className="text-xs text-blue-600">• Avoid busy backgrounds so the AI can focus better</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-slate-200 p-12 shadow-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <BilingualText
              className="text-lg text-slate-800 mb-2"
              translation="Result not found"
            >
              Hasil tidak ditemukan
            </BilingualText>
            <BilingualText
              className="text-sm text-slate-600 mb-6"
              translation="Check the shared link again or return to the home page."
            >
              Periksa kembali link yang kamu bagikan atau kembali ke halaman utama.
            </BilingualText>
            <button
              onClick={() => navigate('/')}
              className="inline-flex flex-col items-start gap-1 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-md"
            >
              <span>← Kembali ke Beranda</span>
              <span className="text-xs text-slate-100">Back to Home</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
