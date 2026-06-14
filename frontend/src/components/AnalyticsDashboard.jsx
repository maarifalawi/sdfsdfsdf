import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsDashboard({ refreshTrigger, hasHistory }) {
  const [analytics, setAnalytics] = useState(null);
  const [trainingHistory, setTrainingHistory] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const resetAnalyticsState = () => {
    setAnalytics({
      final_accuracy: 0,
      final_precision: 0,
      final_top3_accuracy: 0,
      total_predictions: 0,
      quality_distribution: {},
      label_distribution: {},
      confidence_histogram: [],
    });
    setTrainingHistory({
      loss: [],
      val_loss: [],
      accuracy: [],
      val_accuracy: [],
    });
    setEvaluation({
      confusion_matrix: [],
      labels: [],
    });
    setError('');
    setLoading(false);
  };

  useEffect(() => {
    if (!hasHistory) {
      resetAnalyticsState();
      return;
    }

    loadAnalytics();
  }, [hasHistory, refreshTrigger]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load ML service analytics
      const [analyticsRes, historyRes, evalRes] = await Promise.all([
        api.get('/ml/analytics'),
        api.get('/ml/training-history'),
        api.get('/ml/evaluation')
      ]);

      setAnalytics(analyticsRes.data);
      setTrainingHistory(historyRes.data);
      setEvaluation(evalRes.data);

    } catch (err) {
      console.error('Analytics load error:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadAnalytics}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="card-shell surface-strong p-6 overflow-hidden">
        <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(79,70,229,0.14),_transparent_70%)]" />
        <div className="absolute right-0 top-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(8,145,178,0.12),_transparent_70%)]" />
        <div className="relative z-10">
          <h1 className="text-3xl font-semibold text-slate-950 mb-2">🧠 AI Model Analytics</h1>
          <p className="max-w-2xl text-sm text-slate-500">Insight performa model dan distribusi prediksi untuk meningkatkan keandalan klasifikasi Batik.</p>
        </div>
      </div>

      {analytics && analytics.final_accuracy !== undefined && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-shell surface p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-sm">
                🎯
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Accuracy</p>
                <p className="text-2xl font-semibold text-slate-950">{(analytics.final_accuracy * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="card-shell surface p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primarySoft/10 text-primarySoft shadow-sm">
                🎪
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Precision</p>
                <p className="text-2xl font-semibold text-slate-950">{(analytics.final_precision * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="card-shell surface p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-secondary/10 text-secondary shadow-sm">
                🔍
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Top-3 Acc</p>
                <p className="text-2xl font-semibold text-slate-950">{(analytics.final_top3_accuracy * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="card-shell surface p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-accent/10 text-accent shadow-sm">
                📊
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Predictions</p>
                <p className="text-2xl font-semibold text-slate-950">{analytics.total_predictions || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Training History */}
      {trainingHistory && trainingHistory.loss && trainingHistory.loss.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📈 Training History</h2>
          <div className="h-80">
            <Line
              data={{
                labels: trainingHistory.loss.map((_, i) => `Epoch ${i + 1}`),
                datasets: [
                  {
                    label: 'Training Loss',
                    data: trainingHistory.loss,
                    borderColor: 'rgba(79, 70, 229, 1)',
                    backgroundColor: 'rgba(79, 70, 229, 0.12)',
                    tension: 0.4,
                  },
                  {
                    label: 'Validation Loss',
                    data: trainingHistory.val_loss,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    tension: 0.4,
                  },
                  {
                    label: 'Training Accuracy',
                    data: trainingHistory.accuracy,
                    borderColor: 'rgba(8, 145, 178, 1)',
                    backgroundColor: 'rgba(8, 145, 178, 0.12)',
                    yAxisID: 'y1',
                    tension: 0.4,
                  },
                  {
                    label: 'Validation Accuracy',
                    data: trainingHistory.val_accuracy,
                    borderColor: 'rgba(14, 165, 233, 1)',
                    backgroundColor: 'rgba(14, 165, 233, 0.12)',
                    yAxisID: 'y1',
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Loss',
                    },
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: true,
                      text: 'Accuracy',
                    },
                    min: 0,
                    max: 1,
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Confusion Matrix */}
      {evaluation && evaluation.confusion_matrix && evaluation.confusion_matrix.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🎯 Confusion Matrix</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    True / Predicted
                  </th>
                  {evaluation.labels.map((label, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evaluation.confusion_matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {evaluation.labels[i]}
                    </td>
                    {row.map((cell, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prediction Analytics */}
      {analytics && analytics.quality_distribution && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Confidence Quality Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🎚️ Prediction Confidence Quality</h2>
            <div className="h-64">
              <Pie
                data={{
                  labels: Object.keys(analytics.quality_distribution),
                  datasets: [{
                    data: Object.values(analytics.quality_distribution),
                    backgroundColor: [
                      'rgba(34, 197, 94, 0.8)',   // high
                      'rgba(251, 191, 36, 0.8)',  // medium
                      'rgba(239, 68, 68, 0.8)',   // low
                      'rgba(156, 163, 175, 0.8)', // very_low
                    ],
                    borderWidth: 2,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>

          {/* Label Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🏷️ Prediction Label Distribution</h2>
            <div className="h-64">
              <Bar
                data={{
                  labels: Object.keys(analytics.label_distribution || {}),
                  datasets: [{
                    label: 'Predictions',
                    data: Object.values(analytics.label_distribution || {}),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confidence Histogram */}
      {analytics && analytics.confidence_histogram && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📊 Confidence Score Distribution</h2>
          <div className="h-64">
            <Bar
              data={{
                labels: ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%'],
                datasets: [{
                  label: 'Predictions',
                  data: analytics.confidence_histogram,
                  backgroundColor: 'rgba(168, 85, 247, 0.8)',
                  borderColor: 'rgba(168, 85, 247, 1)',
                  borderWidth: 1,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}