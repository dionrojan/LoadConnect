import React, { createContext, useContext, useState, useEffect } from 'react';
import { client, authAPI } from '../services/api';
import { socketService } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('yoki_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('yoki_token'));
  const [loading, setLoading] = useState(true);

  // Initial user hydration from backend
  useEffect(() => {
    async function hydrate() {
      const storedToken = localStorage.getItem('yoki_token');
      if (storedToken) {
        client.setToken(storedToken);
        try {
          const res = await authAPI.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('yoki_user', JSON.stringify(res.user));
            socketService.connect(storedToken);
          }
        } catch (err) {
          console.warn('Session hydration failed:', err.message);
          // If token expired/invalid, clear
          if (err.status === 401 || err.status === 403) {
            logout();
          }
        }
      }
      setLoading(false);
    }

    hydrate();

    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('yoki_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('yoki_unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res?.token && res?.user) {
      client.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('yoki_user', JSON.stringify(res.user));
      socketService.connect(res.token);
      return res.user;
    }
    throw new Error('Invalid login response');
  };

  const signup = async (formData) => {
    const res = await authAPI.signup(formData);
    if (res?.token && res?.user) {
      client.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('yoki_user', JSON.stringify(res.user));
      socketService.connect(res.token);
      return res.user;
    }
    throw new Error('Registration failed');
  };

  const logout = () => {
    client.setToken(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem('yoki_user');
    socketService.disconnect();
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      if (res?.user) {
        setUser(res.user);
        localStorage.setItem('yoki_user', JSON.stringify(res.user));
        return res.user;
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  // Switch demo account for seamless testing
  const switchDemo = async (role) => {
    const email = role === 'driver' ? 'demo_driver@yoki.test' : 'demo_merchant@yoki.test';
    const password = 'password123';
    try {
      return await login(email, password);
    } catch {
      // If not yet registered on backend, register demo user
      const demoData = role === 'driver' ? {
        name: 'Dave "Longhaul" Miller',
        email,
        password,
        phone: '+1 555-0199',
        role: 'driver',
        vehicle_type: '53ft Semi Trailer',
        max_capacity: 26,
      } : {
        name: 'Maria Santos Produce',
        email,
        password,
        phone: '+1 555-0288',
        role: 'merchant',
        business_name: 'Santos Mexican Food Imports',
        business_address: '450 Broad St, Houston TX',
      };
      return await signup(demoData);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      signup,
      logout,
      refreshUser,
      switchDemo,
      isAuthenticated: !!user && !!token,
      isDriver: user?.role === 'driver',
      isMerchant: user?.role === 'merchant',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
