import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken } from '../services/api';

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setAuthToken(token);
      api.get('/auth/verify')
        .then((response) => {
          if (response.data?.success) {
            navigate('/admin', { replace: true });
          }
        })
        .catch(() => {
          localStorage.removeItem('admin_token');
          setAuthToken(null);
        });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      localStorage.setItem('admin_token', response.data.token);
      setAuthToken(response.data.token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal');
      console.error('LOGIN ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md mt-12 card-shell surface p-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.32em] text-slate-500 mb-4">Admin Access</p>
        <h1 className="text-3xl font-bold text-slate-950">Masuk ke Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Gunakan kredensial admin untuk mengelola dataset dan model.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@domain.com"
            className="input-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password admin"
              className="input-primary pr-20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-semibold"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Masuk...' : 'Login'}
        </button>
      </form>
    </div>
  );
}