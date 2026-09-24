import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [providerProfile, setProviderProfile] = useState(() => {
    const saved = localStorage.getItem('providerProfile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Initialize and check current session
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const data = await authService.getMe();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.provider) {
              setProviderProfile(data.provider);
              localStorage.setItem('providerProfile', JSON.stringify(data.provider));
            }
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    if (data.success) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.provider) {
        setProviderProfile(data.provider);
        localStorage.setItem('providerProfile', JSON.stringify(data.provider));
      } else {
        setProviderProfile(null);
        localStorage.removeItem('providerProfile');
      }
      return data;
    }
    throw new Error(data.message || 'Login failed');
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    if (data.success) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    }
    throw new Error(data.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProviderProfile(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('providerProfile');
  };

  const updateProviderState = (profile) => {
    setProviderProfile(profile);
    localStorage.setItem('providerProfile', JSON.stringify(profile));
  };

  const isCustomer = user?.role === 'customer';
  const isProvider = user?.role === 'provider';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        providerProfile,
        loading,
        login,
        register,
        logout,
        updateProviderState,
        isAuthenticated: !!token && !!user,
        isCustomer,
        isProvider,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
