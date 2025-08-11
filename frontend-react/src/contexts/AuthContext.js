import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Crear instancia específica de Axios para el proyecto
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

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

  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('🔍 Verificando estado de autenticación...');
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        console.log('✅ Usuario autenticado:', response.data.user);
      } else {
        console.log('❌ Respuesta de auth/me no exitosa');
        logout();
      }
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    console.log('🚪 Cerrando sesión...');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  }, []);

  // Configurar interceptor para incluir token en todas las peticiones
  useEffect(() => {
    // Configurar interceptor para incluir token en todas las peticiones
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

    // Configurar interceptor de respuesta para manejar errores 401
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('❌ Token expirado o inválido, redirigiendo a login');
          logout();
        }
        return Promise.reject(error);
      }
    );

    if (token) {
      console.log('✅ Token encontrado en localStorage:', token.substring(0, 20) + '...');
      checkAuthStatus();
    } else {
      console.log('❌ No hay token en localStorage');
      setLoading(false);
    }

    // Cleanup de interceptores
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [token, checkAuthStatus, logout]);

  const login = async (dni, password) => {
    console.log('🚀 FUNCIÓN LOGIN INICIADA');
    console.log('🔐 Iniciando login para DNI:', dni);
    console.log('📤 Enviando petición a:', 'http://localhost:5000/api/auth/login');
    console.log('📤 Datos enviados:', { dni, password });
    
    try {
      console.log('📡 ANTES DE LA PETICIÓN HTTP');
      
      // Usar axios directamente para el login
      const response = await axios.post('http://localhost:5000/api/auth/login', { dni, password });

      console.log('📡 DESPUÉS DE LA PETICIÓN HTTP');
      console.log('📡 Respuesta completa del backend:', response);
      console.log('📡 response.status:', response.status);
      console.log('📡 response.headers:', response.headers);
      console.log('📡 response.data:', response.data);
      console.log('📡 response.data.success:', response.data.success);
      console.log('📡 Estructura completa de response.data:', JSON.stringify(response.data, null, 2));
      console.log('📡 response.data.token:', response.data.token);
      console.log('📡 response.data.user:', response.data.user);

      if (response.data.success) {
        // El backend devuelve: { success: true, data: { user: {...}, token: "..." } }
        const { data } = response.data;
        const newToken = data.token;
        const userData = data.user;
        
        console.log('🔑 Token extraído:', newToken);
        console.log('👤 Usuario extraído:', userData);
        
        if (!newToken) {
          console.error('❌ Token es undefined o null');
          return { success: false, message: 'Token no recibido del servidor' };
        }

        console.log('✅ Login exitoso, token recibido:', newToken.substring(0, 20) + '...');
        
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('token', newToken);
        
        console.log('💾 Token guardado en localStorage y estado');
        return { success: true };
      } else {
        console.log('❌ Login falló:', response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      console.error('❌ Error completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
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

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    refreshToken,
    token,
    api // Exportar la instancia de Axios configurada
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
