import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';

export default function TrainingPanel({ onTrainingSuccess }) {
  const [training, setTraining] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const pollingRef = useRef(null);

  const refreshStatus = async () => {
    try {
      const { data } = await api.get('/ml/training-status');
      if (data && data.state) {
        setStatus(data.state === 'running' ? 'Training berjalan...' : data.state === 'completed' ? 'Training selesai.' : data.state);
        if (typeof data.progress === 'number') {
          setProgress(Math.min(100, Math.max(0, data.progress)));
        }
        if (data.log) {
          setLogs((prev) => {
            const next = [...prev, data.log];
            return next.slice(-10);
          });
        }
      }
      if (training && data.state !== 'running') {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } catch (err) {
      console.warn('Training status polling failed:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(refreshStatus, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    setProgress(0);
    setStatus('Menjalankan training...');
    setMessage('Memulai proses training, mohon tunggu...');
    setLogs([]);
    setError('');
    startPolling();

    try {
      const { data } = await api.post('/admin/train');
      console.log('Training response:', data);
      setMessage(data.message || 'Training selesai.');
      setStatus('completed');
      setProgress(100);
      if (onTrainingSuccess) onTrainingSuccess();
    } catch (err) {
      stopPolling();
      console.error('Training error:', err);
      console.error('Error response:', err.response?.data);
      
      const errorDetail = err.response?.data?.detail || err.response?.data?.message || err.response?.data?.error || err.message;
      const fullError = err.response?.data || {};
      
      setError(JSON.stringify(errorDetail, null, 2) || 'Training model gagal.');
      setMessage('Terjadi kesalahan saat training. Lihat detail di bawah.');
      setStatus('error');
    } finally {
      setTraining(false);
      stopPolling();
      await refreshStatus();
    }
  };

  return (
    <div className="card-shell surface overflow-hidden">
      {/* Header */}
      <div className="card-shell surface-strong p-8 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-[radial-gradient(circle,_rgba(79,70,229,0.18),_transparent_52%)]" />
        <div className="absolute -left-16 -bottom-16 w-36 h-36 rounded-full bg-[radial-gradient(circle,_rgba(139,92,246,0.16),_transparent_52%)]" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-slate-950 flex items-center gap-3">🎯 Train Model</h2>
            <p className="mt-2 text-sm text-slate-500">Training ulang model AI dengan dataset terbaru</p>
          </div>
          <button
            onClick={handleTrain}
            disabled={training}
            className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {training ? 'Menjalankan...' : 'Mulai Training'}
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-slate-700">{status || '⏳ Menunggu aksi training...'}</span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-900">{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500">
            <p className="text-sm text-blue-700 font-semibold">ℹ️ {message}</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border-l-4 border-red-500">
            <p className="text-sm text-red-700 font-semibold">❌ {error}</p>
          </div>
        )}

        {/* Training Logs */}
        {logs.length > 0 && (
          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">📋 Log Training Terbaru</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {logs.map((line, index) => (
                <p key={index} className="text-xs text-slate-700 font-mono truncate hover:overflow-visible" title={line}>
                  → {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
