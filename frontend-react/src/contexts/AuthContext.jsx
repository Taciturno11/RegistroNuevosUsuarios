import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 🌐 Obtener URL del backend desde variable de entorno
const getBackendURL = () => {
  // Usar variable de entorno obligatoria
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  return `${backendURL}/api`;
};

// Crear instancia específica de Axios para el proyecto
const api = axios.create({
  baseURL: getBackendURL(),
  timeout: 10000,
});

console.log('🌐 AuthContext - URL del backend configurada:', getBackendURL());

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [selectedEmployee, setSelectedEmployee] = useState(() => {
    const dni = localStorage.getItem('empleadoDNI');
    const nombre = localStorage.getItem('empleadoNombre');
    return dni && nombre ? { dni, nombre } : null;
  });

  console.log('🔄 AuthContext estado actual:', {
    user: user ? `${user.dni} (${user.role})` : 'null',
    token: token ? 'presente' : 'null',
    isAuthenticated,
    loading,
    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    userDetails: user ? {
      dni: user.dni,
      role: user.role,
      vistas: user.vistas || [],
      nombres: user.nombres,
      apellidoPaterno: user.apellidoPaterno,
      apellidoMaterno: user.apellidoMaterno
    } : 'No user'
  });

  const logout = useCallback(() => {
    console.log('🚪 Cerrando sesión...');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setSelectedEmployee(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('empleadoDNI');
    localStorage.removeItem('empleadoNombre');
  }, []);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
          console.log('🔑 Token agregado a petición:', config.url, 'Token:', currentToken.substring(0, 20) + '...');
        } else {
          console.log('❌ No hay token disponible para:', config.url);
        }
        return config;
      },
      (error) => {
        console.error('❌ Error en interceptor de request:', error);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('❌ Token expirado o inválido, limpiando estado');
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
          setSelectedEmployee(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('empleadoDNI');
          localStorage.removeItem('empleadoNombre');
        }
        return Promise.reject(error);
      }
    );

    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);
        setIsAuthenticated(true);
        setLoading(false);
        console.log('✅ Sesión restaurada inmediatamente');
      } catch (error) {
        console.error('❌ Error parseando usuario:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [token, logout]);

  const login = async (dni, password) => {
    console.log('🚀 FUNCIÓN LOGIN INICIADA');
    console.log('🔐 Iniciando login para DNI:', dni);
    console.log('📤 Enviando petición a:', '/api/auth/login');
    console.log('📤 Datos enviados:', { dni, password });

    try {
      const response = await api.post('/auth/login', { dni, password });

      console.log('📡 Respuesta completa del backend:', response);
      console.log('📡 response.data:', response.data);

      if (response.data.success) {
        const { data } = response.data;
        const newToken = data.token;
        const userData = data.user;

        if (!newToken) {
          console.error('❌ Token es undefined o null');
          return { success: false, message: 'Token no recibido del servidor' };
        }

        console.log('✅ Login exitoso, token recibido:', newToken.substring(0, 20) + '...');
        console.log('✅ Datos del usuario:', userData);

        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));

        return { success: true };
      } else {
        console.log('❌ Login falló:', response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error de conexión'
      };
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post('/auth/refresh');
      if (response.data.success) {
        const newToken = response.data.token;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return true;
      }
    } catch (error) {
      console.error('❌ Error refrescando token:', error);
      logout();
      return false;
    }
  };

  const setEmployeeData = useCallback((dni, nombre) => {
    if (dni && nombre) {
      const employeeData = { dni, nombre };
      setSelectedEmployee(employeeData);
      localStorage.setItem('empleadoDNI', dni);
      localStorage.setItem('empleadoNombre', nombre);
    } else {
      setSelectedEmployee(null);
      localStorage.removeItem('empleadoDNI');
      localStorage.removeItem('empleadoNombre');
    }
  }, []);

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    refreshToken,
    token,
    selectedEmployee,
    setEmployeeData,
    api
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
