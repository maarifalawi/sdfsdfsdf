import { useState } from 'react';
import ImageUpload from '../components/ImageUpload';
import PredictionResult from '../components/PredictionResult';
import BilingualText from '../components/BilingualText';

export default function Home() {
  const [result, setResult] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const handleResult = (data, imageUrl) => {
    // data sudah berisi image_url dari server, gunakan itu sebagai prioritas
    const resultData = {
      ...data,
      // Pastikan image_url dari server di-prioritas
      image_url: data.image_url || imageUrl,
      image: data.image_url || imageUrl,
      image_path: data.image_url || imageUrl,
    };
    setResult(resultData);
    // Untuk preview lokal di Home page, gunakan image_url dari server jika ada
    setUploadedImageUrl(data.image_url || imageUrl);
  };

  return (
    <main className="bg-gradient-to-b from-slate-50 to-white min-h-screen w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://i1-c.pinimg.com/1200x/10/12/30/10123025995894eff10fc9792d4aa072.jpg')"
          }}
        />
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <BilingualText
              className="inline-flex rounded-full border border-slate-300/40 bg-white/10 px-4 py-1.5 text-xs sm:text-sm uppercase tracking-[0.35em] text-slate-200 font-semibold"
              translation="✨ Sumatra Selatan Batik Classification"
            >
              ✨ Klasifikasi Batik Sumatera Selatan
            </BilingualText>
            <BilingualText
              as="h1"
              className="mt-8 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05]"
            >
              Unggah batik, temukan motif dan makna dengan satu sentuhan
            </BilingualText>
            <BilingualText
              className="mx-auto mt-6 max-w-3xl text-base sm:text-lg text-slate-200 leading-8"
            >
              AI khusus batik Sumatera Selatan untuk klasifikasi cepat, akurat, dan mudah.
            </BilingualText>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12 max-w-7xl mx-auto">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: '⚡ Real-time Klasifikasi',
              description: 'Unggah satu gambar, dapatkan hasil prediksi batik cepat dan mudah.'
            },
            {
              title: '📊 Insight Model',
              description: 'Lihat confidence, top-3 prediksi, dan informasi kecocokan.'
            },
            {
              title: '🧠 AI Berbasis Batik Lokal',
              description: 'Model terlatih dengan motif batik Sumatera Selatan, bukan hanya foto umum.'
            },
            {
              title: '📷 Foto Optimasi',
              description: 'Dapatkan rekomendasi foto agar hasil klasifikasi lebih akurat.'
            }
          ].map((item) => (
            <div key={item.title} className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
              <div>
                <p className="text-xl font-semibold text-slate-900 mb-3">{item.title}</p>
                <p className="text-sm text-slate-600 leading-7">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14 max-w-7xl mx-auto">
        {!result ? (
          // Upload State
          <div className="flex flex-col gap-10">
            <div className="mx-auto max-w-3xl text-center">
              <BilingualText
                as="h2"
                className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight"
                translation="Let's get started!"
              >
                Mari Mulai!
              </BilingualText>
              <BilingualText
                className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-8"
                translation="Choose or drag your batik image to analyze."
              >
                Pilih atau drag gambar batik Anda untuk dianalisis
              </BilingualText>
            </div>

            <div className="mx-auto w-full max-w-2xl">
              <ImageUpload onResult={handleResult} />
            </div>

            <div className="mx-auto w-full max-w-5xl">
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-3">Langkah 1</p>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Unggah Foto</h3>
                  <p className="text-sm text-slate-600 leading-7">Seret atau pilih foto batik yang akan diklasifikasikan.</p>
                </div>
                <div className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-3">Langkah 2</p>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Tunggu Hasil</h3>
                  <p className="text-sm text-slate-600 leading-7">Sistem akan memproses dan memberi prediksi beserta confidence.</p>
                </div>
                <div className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold mb-3">Langkah 3</p>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Pelajari Hasil</h3>
                  <p className="text-sm text-slate-600 leading-7">Dapatkan top-3 prediksi, tips foto, dan penjelasan motif.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Result State
          <div className="space-y-6 animate-fadeIn w-full">
            {/* Back Button */}
            <button
              onClick={() => {
                setResult(null);
                setUploadedImageUrl(null);
              }}
              className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold transition-colors text-sm sm:text-base"
            >
              ← Unggah Gambar Lain
            </button>

            {/* Results Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Image Column - Desktop Sticky */}
              <div className="md:col-span-1 order-2 md:order-1">
                <div className="sticky top-4 space-y-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span>📸</span>
                      <span>Gambar Batik</span>
                    </h3>
                    <p className="text-xs text-slate-500">Batik Image</p>
                  </div>
                  {uploadedImageUrl && (
                    <div className="rounded-3xl overflow-hidden border-2 border-slate-200 shadow-2xl bg-white aspect-square">
                      <img 
                        src={uploadedImageUrl} 
                        alt="Gambar batik yang diunggah" 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setResult(null);
                      setUploadedImageUrl(null);
                    }}
                    className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 font-semibold transition hover:shadow-md active:scale-[0.98] text-sm sm:text-base"
                  >
                    Unggah Baru
                  </button>
                </div>
              </div>

              {/* Results Column */}
              <div className="md:col-span-2 order-1 md:order-2">
                <div className="space-y-2 mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>🎯</span>
                    <span>Hasil Analisis</span>
                  </h3>
                  <p className="text-sm text-slate-500">Analysis Results</p>
                </div>
                <PredictionResult result={result} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        /* Responsive typography scaling */
        @media (max-width: 640px) {
          body {
            font-size: 14px;
          }
        }

        /* Safe area padding for notch devices */
        @supports (padding: max(0px)) {
          body {
            padding-left: max(1rem, env(safe-area-inset-left));
            padding-right: max(1rem, env(safe-area-inset-right));
          }
        }

        /* Prevent zoom on input focus on iOS */
        input, textarea, select {
          font-size: 16px;
        }

        /* Touch optimization */
        button, input[type="file"], a {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
    </main>
  );
}
