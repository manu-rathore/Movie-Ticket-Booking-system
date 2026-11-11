import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await api.post(`/auth/${mode}`, form);
      login(r.data);
      navigate(r.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
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
        <div>
          <span className="dim" style={{ fontSize: '12px' }}>Aapka Poora Naam</span>
          <input
            name="name"
            placeholder="e.g. Rahul Sharma"
            value={form.name}
            onChange={change}
            required
          />
        </div>
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
        <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }}>
          <b>Demo Admin Login:</b>
          <br />
          Email: <code>admin@movie.com</code> | Password: <code>admin123</code>
        </div>
      )}
    </form>
  );
}
