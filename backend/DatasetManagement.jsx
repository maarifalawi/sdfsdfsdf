import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Sesuaikan dengan setup axios Anda

const DatasetManagement = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 1. Fungsi Reusable untuk mengambil data
  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/datasets');
      setDatasets(res.data);
    } catch (err) {
      console.error('Gagal mengambil dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch data saat komponen pertama kali dimuat
  useEffect(() => {
    fetchDatasets();
  }, []);

  // 3. Handler Upload
  const handleUpload = async (formData) => {
    setUploading(true);
    try {
      await api.post('/datasets/upload', formData);
      // Update otomatis: Panggil fetchDatasets() tanpa reload browser
      await fetchDatasets();
      alert('Upload berhasil!');
    } catch (err) {
      alert('Gagal mengunggah dataset.');
    } finally {
      setUploading(false);
    }
  };

  // 4. Handler Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus?')) return;
    try {
      await api.delete(`/datasets/${id}`);
      // Update otomatis: Filter state lokal (instan) atau panggil ulang API
      setDatasets(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert('Gagal menghapus dataset.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manajemen Dataset</h1>
      
      {/* Form Upload Placeholder */}
      <div className="mb-8 p-4 border rounded">
        <button 
          disabled={uploading}
          onClick={() => {/* Logika form upload */}}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {uploading ? 'Mengunggah...' : 'Upload Dataset Baru'}
        </button>
      </div>

      {/* Daftar Dataset */}
      {loading ? <p>Memuat data...</p> : (
        <div className="grid grid-cols-3 gap-4">
          {datasets.map((ds) => (
            <div key={ds.id} className="border p-2 rounded relative">
              <img src={ds.image_url} alt={ds.label} className="w-full h-32 object-cover" />
              <p className="mt-2 font-semibold">{ds.label}</p>
              <button 
                onClick={() => handleDelete(ds.id)}
                className="text-red-500 text-sm underline">Hapus</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatasetManagement;