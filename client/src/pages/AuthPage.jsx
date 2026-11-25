import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await api.post(`/auth/${mode}`, form);
      login(r.data);
      showToast(`Welcome, ${r.data.user.name}! 🎬`, 'success');
      navigate(r.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm((prev) => ({ ...prev, email, password }));
    showToast('Demo credentials bhar diye gaye hain! Login button dabayein.', 'info');
  };

  return (
    <form className="card auth-box" onSubmit={submit}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '32px' }}>{isLogin ? '👋' : '✨'}</span>
        <h2>{isLogin ? 'Welcome Back!' : 'Create an Account'}</h2>
        <p className="muted" style={{ fontSize: '13.5px' }}>
          {isLogin ? 'Apne account me login karke tickets book karein' : 'CineBook se jud kar movies ka maza lein'}
        </p>
      </div>

      {!isLogin && (
        <>
          <div>
            <span className="dim" style={{ fontSize: '12px' }}>Aapka Poora Naam</span>
            <input
              name="name"
              placeholder="e.g. Manu Rathore"
              value={form.name}
              onChange={change}
              required
            />
          </div>
          <div>
            <span className="dim" style={{ fontSize: '12px' }}>Mobile Number (Optional)</span>
            <input
              name="phone"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={change}
            />
          </div>
        </>
      )}

      <div>
        <span className="dim" style={{ fontSize: '12px' }}>Email Address</span>
        <input
          name="email"
          type="email"
          placeholder="name@example.com"
          value={form.email}
          onChange={change}
          required
        />
      </div>

      <div>
        <span className="dim" style={{ fontSize: '12px' }}>Password</span>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={change}
          required
        />
      </div>

      {error && <p className="error">{error}</p>}

      <button className="btn" disabled={loading}>
        {loading ? 'Kripya intezar karein...' : isLogin ? 'Login Now →' : 'Register Account →'}
      </button>

      <p className="muted" style={{ textAlign: 'center', marginTop: '10px' }}>
        {isLogin ? (
          <>
            Account nahi hai? <Link to="/register">Naya account banayein</Link>
          </>
        ) : (
          <>
            Pehle se account hai? <Link to="/login">Yahan Login karein</Link>
          </>
        )}
      </p>

      {isLogin && (
        <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '12px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
          <b style={{ color: '#e2e8f0' }}>Quick Demo Logins:</b>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn small outline"
              style={{ flex: 1, fontSize: '11.5px' }}
              onClick={() => fillDemo('manu@movie.com', 'manu123')}
            >
              👤 User Demo
            </button>
            <button
              type="button"
              className="btn small outline"
              style={{ flex: 1, fontSize: '11.5px' }}
              onClick={() => fillDemo('admin@movie.com', 'admin123')}
            >
              ⚡ Admin Demo
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
