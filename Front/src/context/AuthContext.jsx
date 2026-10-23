import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../lib/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  useEffect(() => {
    if (tokenStore.get()) {
      api.get('/auth/me').then(setUser).catch(() => tokenStore.clear()).finally(() => setLoading(false));
    }
    const expired = () => setUser(null);
    window.addEventListener('auth-expired', expired);
    return () => window.removeEventListener('auth-expired', expired);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    tokenStore.set(res.token);
    setUser(res.user);
    return res.user;
  };
  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    tokenStore.set(res.token);
    setUser(res.user);
    return res.user;
  };
  const logout = () => {
    tokenStore.clear();
    localStorage.removeItem('cart');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
