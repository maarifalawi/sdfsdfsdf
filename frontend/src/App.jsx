import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Home from './pages/Home';
import ResultPage from './pages/ResultPage';
import AdminLogin from './components/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load admin page for code splitting
const LazyAdmin = lazy(() => import('./pages/Admin'));

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Oops! Terjadi Kesalahan</h1>
            <p className="text-slate-600 mb-4">Aplikasi mengalami masalah yang tidak terduga.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors min-h-[44px]"
            >
              Reload Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50/95 text-slate-900 w-full overflow-x-hidden">
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center rounded-[1.5rem] surface p-8 shadow-soft">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Memuat aplikasi...</p>
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<ProtectedRoute><LazyAdmin /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
