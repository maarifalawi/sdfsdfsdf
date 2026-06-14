export default function HistoryTable({ items, onClearHistory }) {
  if (!items || !items.length) {
    return (
      <div className="rounded-2xl bg-white shadow-md p-12 text-center">
        <div className="text-5xl mb-4 opacity-40">📭</div>
        <p className="text-slate-500 font-semibold">Belum ada riwayat klasifikasi</p>
        <p className="text-sm text-slate-400 mt-1">Riwayat prediksi akan tampil di sini</p>
      </div>
    );
  }

  return (
    <div className="card-shell surface overflow-hidden">
      <div className="card-shell surface-strong p-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-[radial-gradient(circle,_rgba(79,70,229,0.14),_transparent_50%)]" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950 flex items-center gap-3">📋 Riwayat Klasifikasi</h2>
            <p className="mt-2 text-sm text-slate-500">{items.length} prediksi tercatat</p>
          </div>
          {onClearHistory && (
            <button
              onClick={onClearHistory}
              className="btn-secondary text-slate-900 whitespace-nowrap"
            >
              Hapus Riwayat
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table-shell w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="px-6 py-4 text-left">📅 Tanggal & Waktu</th>
              <th className="px-6 py-4 text-left">🎨 Label Prediksi</th>
              <th className="px-6 py-4 text-left">📊 Confidence</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const confidence = item.confidence_score !== null && item.confidence_score !== undefined
                ? (item.confidence_score * 100).toFixed(2)
                : 'N/A';
              const confidenceColor = confidence === 'N/A' ? 'slate' : parseInt(confidence) >= 80 ? 'green' : parseInt(confidence) >= 60 ? 'amber' : 'orange';

              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-6 py-4 text-slate-700 font-medium">{new Date(item.created_at).toLocaleString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge-pill muted">{item.prediction_label || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {confidence === 'N/A' ? (
                      <span className="text-slate-500 font-semibold">—</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              confidenceColor === 'green' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' :
                              confidenceColor === 'amber' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                              'bg-gradient-to-r from-orange-500 to-rose-500'
                            }`}
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                        <span className={`font-semibold ${
                          confidenceColor === 'green' ? 'text-emerald-600' :
                          confidenceColor === 'amber' ? 'text-amber-600' :
                          'text-orange-600'
                        }`}>{confidence}%</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
