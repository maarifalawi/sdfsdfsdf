import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken } from '../services/api';
import AdminDashboard from '../components/AdminDashboard';
import DatasetManager from '../components/DatasetManager';
import TrainingPanel from '../components/TrainingPanel';
import HistoryTable from '../components/HistoryTable';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

export default function Admin() {
  const [history, setHistory] = useState([]);
  const [analyticsRefreshTrigger, setAnalyticsRefreshTrigger] = useState(0);
  const [analyticsResetKey, setAnalyticsResetKey] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    totalPredictions: 0,
    totalDatasets: 0,
    latestPredictions: [],
    modelStatus: 'Tidak tersedia',
    successRate: 0,
    modelVersion: 'v2.1'
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const { data } = await api.get('/admin/predictions/history');
        if (active) setHistory(data);
      } catch (error) {
        console.error('Failed loading admin history:', error);
      }
    }

    loadHistory();
    const interval = setInterval(loadHistory, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboardStats() {
      setDashboardLoading(true);
      try {
        const { data } = await api.get('/admin/dashboard');
        if (active) {
          setDashboardStats({
            totalPredictions: data.totalPredictions ?? 0,
            totalDatasets: data.totalDatasets ?? 0,
            latestPredictions: data.latestPredictions ?? [],
            modelStatus: data.modelStatus ?? 'Tidak tersedia',
            successRate: data.successRate ?? data.success_rate ?? 0,
            modelVersion: data.modelVersion ?? data.model_version ?? 'N/A'
          });
        }
      } catch (error) {
        console.error('Failed loading dashboard stats:', error);
      } finally {
        if (active) setDashboardLoading(false);
      }
    }

    loadDashboardStats();
    const dashboardInterval = setInterval(loadDashboardStats, 10000);

    return () => {
      active = false;
      clearInterval(dashboardInterval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAuthToken(null);
    navigate('/admin/login');
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/admin/predictions/history');
      setHistory([]);
      setAnalyticsRefreshTrigger(Date.now());
      setAnalyticsResetKey(Date.now());
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'analytics', name: 'AI Model Analytics', icon: '🤖' },
    { id: 'dataset', name: 'Dataset', icon: '🗂️' },
    { id: 'training', name: 'Training', icon: '🎯' },
    { id: 'history', name: 'History', icon: '📋' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard stats={dashboardStats} isLoading={dashboardLoading} />;
      case 'analytics':
        return (
          <AnalyticsDashboard
            key={analyticsResetKey}
            refreshTrigger={analyticsRefreshTrigger}
            hasHistory={history.length > 0}
          />
        );
      case 'dataset':
        return <DatasetManager />;
      case 'training':
        return <TrainingPanel onTrainingSuccess={() => setAnalyticsRefreshTrigger(Date.now())} />;
      case 'history':
        return (
          <HistoryTable
            items={history}
            onClearHistory={handleClearHistory}
          />
        );
      default:
        return <AdminDashboard stats={dashboardStats} isLoading={dashboardLoading} />;
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-10 overflow-hidden relative dashboard-hero">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute right-8 top-10 h-48 w-48 rounded-full bg-slate-100/5 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-32 w-72 rounded-full bg-slate-950/40 blur-3xl" />
        </div>
        <div className="relative z-10 space-y-7 sm:space-y-8 p-6 md:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_auto] lg:items-center lg:gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-slate-400 mb-4">Admin Panel</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Dashboard Admin</h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300">Kelola model AI, dataset, dan pantau aktivitas sistem dalam satu tampilan yang modern.</p>
            </div>
            <div className="flex justify-end lg:items-center">
              <button
                onClick={handleLogout}
                className="btn-ghost-white rounded-[1.25rem] px-5 py-3 text-sm font-semibold transition hover:bg-white/20"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 items-stretch">
            <div className="dashboard-metric-card p-6 min-h-[6rem]">
              <p className="text-[10px] uppercase tracking-[0.32em] text-slate-400 mb-3">Status Sistem</p>
              <p className="text-lg font-semibold text-white">{dashboardLoading ? '...' : dashboardStats.modelStatus || 'Tidak aktif'}</p>
            </div>
            <div className="dashboard-metric-card p-6 min-h-[6rem]">
              <p className="text-[10px] uppercase tracking-[0.32em] text-slate-400 mb-3">Avg Confidence</p>
              <p className="text-lg font-semibold text-white">
                {dashboardLoading ? '...' : `${(
                  dashboardStats.latestPredictions?.length > 0
                    ? (dashboardStats.latestPredictions.reduce((sum, item) => sum + (item.confidence_score ?? item.confidence ?? 0), 0) / dashboardStats.latestPredictions.length * 100)
                    : 0
                ).toFixed(1)}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <nav className="dashboard-tab-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`dashboard-tab-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6 animate-fadeIn">{renderTabContent()}</div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </main>
  );
}
