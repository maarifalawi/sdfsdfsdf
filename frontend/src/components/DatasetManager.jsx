import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function DatasetManager() {
  const [label, setLabel] = useState('');
  const [files, setFiles] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    async function loadDatasets() {
      const { data } = await api.get('/datasets');
      setDatasets(data);
    }
    loadDatasets().catch(console.error);
  }, []);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (files.length === 0 || !label) {
      setMessage('Label dan gambar diperlukan.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    formData.append('label', label);

    try {
      await api.post('/datasets/upload', formData);
      const { data } = await api.get('/datasets');
      setDatasets(data);
      setFiles([]);
      setLabel('');
      setMessage(`${files.length} gambar berhasil ditambahkan.`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal mengunggah dataset.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus dataset ini?')) {
      return;
    }
    try {
      await api.delete(`/datasets/${id}`);
      setDatasets((prev) => prev.filter((item) => item.id !== id));
      setMessage('Dataset berhasil dihapus.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal menghapus dataset.');
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === datasets.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(datasets.map((item) => item.id));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    if (!window.confirm('Apakah Anda ingin menghapus dataset yang dipilih?')) {
      return;
    }

    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/datasets/${id}`)));
      setDatasets((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      setMessage('Dataset yang dipilih berhasil dihapus.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal menghapus dataset yang dipilih.');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('PERHATIAN: Apakah Anda yakin ingin menghapus SELURUH dataset? Tindakan ini akan menghapus semua file fisik dan data di database.')) {
      return;
    }

    setIsDeletingAll(true);
    try {
      await api.delete('/datasets/all');
      setDatasets([]);
      setSelectedIds([]);
      setMessage('Semua dataset telah berhasil dibersihkan.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal menghapus semua dataset.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="card-shell surface flex flex-col h-full">
      {/* Header */}
      <div className="relative overflow-hidden card-shell surface-strong p-8 mb-6">
        <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-[radial-gradient(circle,_rgba(79,70,229,0.14),_transparent_60%)]" />
        <div className="absolute -left-16 -bottom-16 w-36 h-36 rounded-full bg-[radial-gradient(circle,_rgba(139,92,246,0.12),_transparent_60%)]" />
        <div className="relative z-10">
          <h2 className="text-2xl font-semibold text-slate-950 flex items-center gap-3">📁 Kelola Dataset</h2>
          <p className="mt-2 text-sm text-slate-500">Unggah dan kelola gambar dataset training</p>
        </div>
      </div>

      <div className="px-8 pb-8 flex flex-col h-full">
        {/* Upload Form */}
        <form onSubmit={handleUpload} className="space-y-4 mb-8 p-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 transition-all">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">📝 Kategori / Label Batik</label>
            <input
              type="text"
              placeholder="Contoh: Kawung, Boraspati, Parang..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isUploading}
              className="input-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">🖼️ Pilih Gambar</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              disabled={isUploading}
              className="input-primary"
            />
            {files.length > 0 && (
              <p className="text-xs text-slate-700 mt-2 font-semibold">✓ {files.length} gambar dipilih</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isUploading}
            className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Mengunggah...' : 'Upload Dataset'}
          </button>
        </form>

        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-100 border border-slate-200 text-sm text-slate-700">
            {message}
          </div>
        )}

      <div className="mt-8 flex-1 flex flex-col min-h-0">
        {/* Action Buttons */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950 flex items-center gap-2">📄 Dataset Terkelola</h3>
            <p className="text-sm text-slate-500 mt-1">{datasets.length} dataset tersimpan</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {datasets.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
                  selectedIds.length === 0 
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                🗑️ {selectedIds.length === 0 ? 'Pilih dataset' : `Hapus ${selectedIds.length}`}
              </button>
            )}
            {datasets.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-800 text-sm font-semibold hover:bg-slate-200 transition-all disabled:opacity-50 active:scale-95"
              >
                {isDeletingAll ? 'Memproses...' : 'Hapus Semua'}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {datasets.length > 0 && (
            <div className="sticky top-0 flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800 shadow-sm">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={selectedIds.length === datasets.length}
                  onChange={handleSelectAll}
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span>Centang Semua</span>
              </label>
              <span className="text-xs rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700">{selectedIds.length}/{datasets.length}</span>
            </div>
          )}
          {datasets.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleSelect(item.id)}
              className={`group flex items-center gap-4 rounded-3xl border p-4 transition-all cursor-pointer ${
                selectedIds.includes(item.id)
                  ? 'border-primary/40 bg-slate-100 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
                  selectedIds.includes(item.id)
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                }`}>
                  {selectedIds.includes(item.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </label>
              
              {/* Image */}
              <img 
                src={item.image_url} 
                alt={item.label} 
                className="h-16 w-16 rounded-lg object-cover border-2 border-slate-200 shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0" 
                loading="lazy" 
              />
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 group-hover:text-slate-950 truncate">{item.label}</p>
                <p className="text-xs text-slate-500 mt-1">📅 {new Date(item.created_at).toLocaleString('id-ID', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                className="flex-shrink-0 p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-100 transition-all active:scale-95 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                title="Hapus dataset"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              </button>
            </div>
          ))}
          {/* Empty State */}
          {datasets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4 opacity-30">📂</div>
              <p className="text-slate-500 font-semibold">Belum ada dataset yang diunggah</p>
              <p className="text-sm text-slate-400 mt-1">Mulai dengan mengunggah gambar di atas</p>
            </div>
          )}
        </div>
      </div>
    </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
