import { useState } from 'react';
import { api } from '../services/api';
import BilingualText from './BilingualText';

export default function ImageUpload({ onResult }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile?.type.startsWith('image/')) {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Hanya file gambar yang diterima. / Only image files are accepted.');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Pilih gambar batik terlebih dahulu. / Please choose a batik image first.');
      return;
    }

    setError('');
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const imageUrl = URL.createObjectURL(file);
      const response = await api.post('/predictions', formData);
      onResult(response.data, imageUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal melakukan klasifikasi. / Failed to perform classification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full card-shell surface p-4 sm:p-6 lg:p-8 shadow-lg border border-slate-200">
      <div className="mb-5 sm:mb-7">
        <BilingualText
          as="h2"
          className="text-xl sm:text-2xl font-semibold text-slate-950 mb-1"
          translation="Upload Batik Image"
        >
          Unggah Gambar Batik
        </BilingualText>
        <BilingualText
          className="text-sm text-slate-500"
          translation="Drag & drop or click to choose an image."
        >
          Drag & drop atau klik untuk memilih gambar.
        </BilingualText>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`rounded-3xl border-2 border-dashed p-6 sm:p-8 transition-all duration-200 cursor-pointer text-center ${
            dragActive
              ? 'border-primary bg-primary/10 scale-102'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
            disabled={loading}
          />
          <label htmlFor="file-input" className="cursor-pointer block">
            <svg
              className={`w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 transition-colors ${
                dragActive ? 'text-primary' : 'text-slate-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p className="text-sm sm:text-base text-slate-700 font-semibold leading-snug">
              {dragActive ? 'Lepas gambar di sini' : 'Drag gambar atau klik untuk memilih'}
            </p>
            <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF (Max. 10MB)</p>
            <p className="text-xs text-slate-500 mt-1">Drop image here / Drag image or click to choose</p>
          </label>
        </div>

        <BilingualText
          className="text-xs sm:text-sm text-slate-500 px-2"
          translation="💡 Note: Photos other than batik may not be classified accurately."
        >
          💡 Catatan: Foto selain batik tidak akan diklasifikasikan dengan akurat.
        </BilingualText>

        {file && (
          <div className="space-y-3 sm:space-y-4 animate-fadeIn">
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <img
                src={URL.createObjectURL(file)}
                alt="Preview batik"
                className="w-full object-cover max-h-64 sm:max-h-80"
                loading="lazy"
              />
            </div>
            <p className="text-sm text-slate-700 text-center break-words px-1">
              📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
              className={`w-full rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white font-semibold transition-all duration-200 flex flex-col items-center gap-1 min-h-[54px] touch-manipulation text-sm sm:text-base ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : file
                  ? 'btn-primary hover:shadow-xl active:scale-[0.98]'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <span className="flex items-center gap-2"><span className="inline-block animate-spin">⚙️</span>Memproses...</span>
                  <span className="text-xs text-slate-100">Processing...</span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-2">🔍 Klasifikasikan Sekarang</span>
                  <span className="text-xs text-slate-100">Classify Now</span>
                </>
              )}
        </button>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 animate-shake">
            <p className="text-sm text-red-700 font-semibold">❌ {error}</p>
          </div>
        )}
      </form>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        /* Responsive padding */
        @media (max-width: 640px) {
          input[type="file"] {
            font-size: 16px;
          }
        }

        /* Prevent text zoom on input */
        input, button, textarea {
          font-size: 16px;
        }

        /* Safe area on notch devices */
        @supports (padding: max(0px)) {
          .touch-manipulation {
            -webkit-user-select: none;
            user-select: none;
          }
        }
      `}</style>
    </div>
  );
}
