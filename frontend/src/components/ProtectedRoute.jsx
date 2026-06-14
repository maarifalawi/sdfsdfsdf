import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, setAuthToken } from '../services/api';

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState({ checking: true, authenticated: false });
  const location = useLocation();

  useEffect(() => {
    let active = true;

    async function verifyToken() {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        return active && setStatus({ checking: false, authenticated: false });
      }

      setAuthToken(token);

      try {
        const response = await api.get('/auth/verify');
        if (response.data?.success) {
          return active && setStatus({ checking: false, authenticated: true });
        }
      } catch (error) {
        localStorage.removeItem('admin_token');
        setAuthToken(null);
      }

      if (active) {
        setStatus({ checking: false, authenticated: false });
      }
    }

    verifyToken();

    return () => {
      active = false;
    };
  }, []);

  if (status.checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Memeriksa sesi admin...</p>
        </div>
      </main>
    );
  }

  if (!status.authenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}
