import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

export default function AdminDashboard({ stats = {}, isLoading = false }) {
  const [query, setQuery] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const mergedStats = {
    totalPredictions: 0,
    totalDatasets: 0,
    latestPredictions: [],
    successRate: 0,
    modelVersion: 'v2.1',
    ...stats
  };

  const latestClassName = mergedStats.latestPredictions.length > 3
    ? 'mt-4 space-y-3 max-h-[18rem] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100'
    : 'mt-4 space-y-3';

  const successRate = mergedStats.successRate ?? mergedStats.success_rate ?? 0;
  const modelVersion = mergedStats.modelVersion || mergedStats.model_version || mergedStats.latestPredictions?.[0]?.model_version || 'N/A';

  const StatCard = ({ icon, label, value, accent, delay }) => (
    <div className={`card-shell surface p-6 overflow-hidden transition-all duration-300 ${delay}`}>      
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-slate-100 to-transparent opacity-60 blur-2xl pointer-events-none"></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
            <p className="mt-4 text-3xl font-bold text-slate-950 break-words">{value}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl shadow-sm text-slate-700">
            {icon}
          </div>
        </div>
        <div className="h-1 rounded-full bg-slate-200 overflow-hidden">
          <div className={`h-full rounded-full ${accent}`} />
        </div>
      </div>
    </div>
  );

  const getConfidenceText = (item) => {
    if (item == null) return '-';
    if (item.confidence_score != null) return `${Math.round(item.confidence_score * 100)}%`;
    if (item.confidence != null) return `${Math.round(item.confidence * 100)}%`;
    if (item.confidence_pct != null) return (typeof item.confidence_pct === 'number') ? `${item.confidence_pct}%` : item.confidence_pct;
    return '-';
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thumb-slate-300::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 3px;
        }
        .scrollbar-track-slate-100::-webkit-scrollbar-track {
          background-color: #f1f5f9;
          border-radius: 3px;
        }
        .thumbnail { width:72px; height:72px; object-fit:cover; border-radius:8px }
      `}</style>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <StatCard
          icon="📊"
          label="Total Prediksi"
          value={mergedStats.totalPredictions}
          accent="bg-gradient-to-r from-primary to-secondary"
          delay="transition-all delay-0"
        />
        <StatCard
          icon="📁"
          label="Dataset Terkelola"
          value={mergedStats.totalDatasets}
          accent="bg-gradient-to-r from-primarySoft to-accent"
          delay="transition-all delay-75"
        />
        <StatCard
          icon="🧠"
          label="Model Version"
          value={modelVersion}
          accent="bg-gradient-to-r from-secondary to-primarySoft"
          delay="transition-all delay-100"
        />
        <StatCard
          icon="✅"
          label="Success Rate"
          value={`${successRate}%`}
          accent="bg-gradient-to-r from-accent to-primarySoft"
          delay="transition-all delay-125"
        />
      </div>

      {/* Charts + Metrics Row */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="card-shell surface p-6">
          <h4 className="text-sm font-semibold text-slate-700">Distribusi Kelas</h4>
          <div className="mt-4 h-48">
            <Pie
              data={(() => {
                const dist = mergedStats.classDistribution || mergedStats.distribution || {labels:['A','B'], data:[1,1]};
                const labels = dist.labels || Object.keys(dist);
                const data = dist.data || Object.values(dist).map(v=>v||0);
                return {
                  labels,
                  datasets: [{ data, backgroundColor: ['#60a5fa','#f97316','#34d399','#f43f5e','#a78bfa'] }]
                };
              })()}
              options={{ maintainAspectRatio: false, responsive: true, plugins:{legend:{position:'bottom'}} }}
              height={180}
            />
          </div>
        </div>

        <div className="card-shell surface p-6">
          <h4 className="text-sm font-semibold text-slate-700">Trend Akurasi</h4>
          <div className="mt-4 h-44">
            <Line
              data={(() => {
                const trend = mergedStats.accuracyTrend || mergedStats.trend || {labels:['-'], data:[successRate]};
                const labels = trend.labels || trend.map((_,i)=>`T${i+1}`);
                const data = trend.data || trend.map(v=>v||0);
                return { labels, datasets: [{ label: 'Akurasi (%)', data, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)', tension:0.3 }] };
              })()}
              options={{ maintainAspectRatio:false, plugins:{legend:{display:false}} }}
            />
          </div>
        </div>

        <div className="card-shell surface p-6">
          <h4 className="text-sm font-semibold text-slate-700">Metrik Model</h4>
          <div className="mt-4">
            <Bar
              data={(() => {
                const metrics = mergedStats.metrics || {Precision:70,Recall:65,F1:67};
                const labels = Object.keys(metrics);
                const data = Object.values(metrics);
                return { labels, datasets: [{ label:'%', data, backgroundColor:['#06b6d4','#f59e0b','#7c3aed'] }] };
              })()}
              options={{ indexAxis:'y', maintainAspectRatio:false, plugins:{legend:{display:false}} }}
              height={140}
            />
          </div>
        </div>
      </div>

      <div className="card-shell surface p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-100 text-2xl text-slate-700 shadow-sm">
            🔔
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Prediksi Terbaru</h3>
            <p className="text-sm text-slate-500">Aktivitas prediksi terakhir</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari label atau id..." className="input w-full" />
          <select value={filterLabel} onChange={e=>setFilterLabel(e.target.value)} className="input w-48">
            <option value="">Semua label</option>
            {(mergedStats.classDistribution?.labels || mergedStats.labels || []).map(l=> (<option key={l} value={l}>{l}</option>))}
          </select>
        </div>

        {mergedStats.latestPredictions.length > 0 ? (
          <div className={latestClassName}>
            {mergedStats.latestPredictions
              .filter(item => {
                if (query && !(`${item.prediction_label}`.toLowerCase().includes(query.toLowerCase()) || `${item.id}`.includes(query))) return false;
                if (filterLabel && item.prediction_label !== filterLabel) return false;
                return true;
              })
              .map((item) => (
              <div
                key={item.id}
                className="group relative flex items-center gap-3 overflow-hidden rounded-3xl surface-strong border border-slate-200 p-4 transition-all duration-300 hover:shadow-lg"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-gradient-to-b from-primary to-secondary" />
                <img src={item.image_url || item.image || item.thumbnail} alt="thumb" className="thumbnail" />
                <div className="ml-2 flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="font-semibold text-slate-950 group-hover:text-slate-900 truncate">{item.prediction_label}</p>
                    <span className="badge-pill muted">Prediksi</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.created_at ? new Date(item.created_at).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Tanggal tidak tersedia'}
                  </p>
                </div>
                <div className="text-right w-28">
                  <p className="font-semibold">{getConfidenceText(item)}</p>
                  <p className="text-xs text-slate-400">{item.source || 'web'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-5xl mb-3 opacity-40">📭</div>
            <p className="text-slate-500 font-semibold">Belum ada riwayat prediksi</p>
            <p className="text-xs text-slate-400 mt-1">Prediksi akan tampil di sini ketika pengguna melakukan prediksi</p>
          </div>
        )}

        {/* Confusion matrix if available */}
        {(() => {
          const cm = mergedStats.confusion_matrix || mergedStats.confusionMatrix;
          const labels = mergedStats.cm_labels || mergedStats.classDistribution?.labels || mergedStats.labels || [];
          if (!cm || cm.length === 0) return null;
          return (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Confusion Matrix</h4>
              <div className="overflow-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left">Actual \ Pred</th>
                      {labels.map(l=> <th key={l} className="text-left">{l}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {cm.map((row,i)=> (
                      <tr key={i} className="odd:bg-slate-50">
                        <td className="font-medium py-2">{labels[i] || `C${i}`}</td>
                        {row.map((cell,j)=> (
                          <td key={j} className="px-3 py-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

      </div>
    </>
  );
}
