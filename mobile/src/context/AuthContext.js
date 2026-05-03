import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

const persistSession = async (data) => {
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
    } catch (_error) {
      // ignore storage errors; still clear in-memory session
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    setUnauthorizedHandler(clearSession);

    const bootstrap = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    return () => setUnauthorizedHandler(null);
  }, []);

  const authHeaders = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` }
    }),
    [token]
  );

  const setSession = async (data) => {
    await persistSession(data);
    setToken(data.token);
    setUser(data);
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    await setSession(data);
    return data;
  };

  const login = async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    await setSession(data);
    return data;
  };

  const refreshSession = async () => {
    if (!token) {
      return;
    }

    const { data } = await api.get('/auth/me', authHeaders);
    await setSession(data);
  };

  const logout = async () => {
    await clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authHeaders,
        register,
        login,
        logout,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
