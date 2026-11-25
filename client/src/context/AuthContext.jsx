import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [city, setCityState] = useState(() => localStorage.getItem('cinebook_city') || 'All');

  const setCity = (nextCity) => {
    localStorage.setItem('cinebook_city', nextCity);
    setCityState(nextCity);
  };

  const login = ({ token, user: nextUser }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
    if (nextUser?.preferredCity && !localStorage.getItem('cinebook_city')) {
      setCity(nextUser.preferredCity);
    }
  };

  const updateUser = (nextUser) => {
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Refresh profile silently on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api
      .get('/auth/me')
      .then((r) => {
        if (r.data?.user) {
          localStorage.setItem('user', JSON.stringify(r.data.user));
          setUser(r.data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, city, setCity }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
