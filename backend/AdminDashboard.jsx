import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalDatasets: 0, modelStatus: 'Ready' });
  const [history, setHistory] = useState([]);
  const [isTraining, setIsTraining] = useState(false);

  // Fungsi untuk mengambil statistik terbaru
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error('Gagal mengambil statistik:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/predictions/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Gagal mengambil riwayat:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, []);

  const handleStartTraining = async () => {
    setIsTraining(true);
    try {
      await api.post('/admin/train');
      alert('Training selesai!');
      // Update otomatis: Statistik dashboard diperbarui setelah training
      await fetchStats();
    } catch (err) {
      alert('Proses training gagal.');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-white shadow rounded-lg">
          <p className="text-gray-500">Total Dataset</p>
          <p className="text-4xl font-bold">{stats.totalDatasets}</p>
        </div>
        <div className="p-6 bg-white shadow rounded-lg">
          <p className="text-gray-500">Model Status</p>
          <p className={`text-xl font-bold ${stats.modelStatus === 'Ready' ? 'text-green-500' : 'text-orange-500'}`}>
            {stats.modelStatus}
          </p>
        </div>
      </div>

      <div className="mb-8 bg-white p-6 shadow rounded-lg">
        <h2 className="text-xl font-bold mb-4">Riwayat Prediksi Terbaru</h2>
        <div className="mt-4 max-h-48 overflow-y-auto border border-gray-100 rounded-md bg-gray-50 shadow-inner">
          {history && history.length > 0 ? (
            history.map((item, index) => (
              <div key={item.id || index} className="p-3 border-b border-gray-200 last:border-0 hover:bg-white transition">
                <p className="font-semibold text-gray-800">{item.prediction_label}</p>
                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="p-4 text-gray-500 text-center italic">Belum ada riwayat prediksi.</p>
          )}
        </div>
      </div>

      <button
        onClick={handleStartTraining}
        disabled={isTraining}
        className={`px-6 py-3 rounded-lg text-white font-bold ${isTraining ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
      >
        {isTraining ? 'Sedang Training...' : 'Mulai Training Model'}
      </button>
    </div>
  );
};

export default AdminDashboard;