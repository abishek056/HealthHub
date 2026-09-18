import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = React.useCallback(async () => {
    try {
      const response = await api.get('/user');
      const userData = response.data;
      setUser(userData);
      setRole(userData.role);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (error) {
      // 401 will be handled by the interceptor
      if (error.response?.status !== 401) {
         console.error("Auth check failed", error);
      }
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      if (isAuthenticated) {
        await api.post('/logout');
      }
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      // Always clean up local state
      setToken(null);
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      toast.success('Logged out successfully');
    }
  }, [isAuthenticated]);

  // Initialize auth state from local storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setRole(parsedUser.role);
          setIsAuthenticated(true);
          
          // Optionally verify token with backend
          await checkAuth();
        } catch (error) {
          console.error("Failed to parse stored user", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [checkAuth, logout]);

  const login = async (email, password, selectedRole) => {
    try {
      const response = await api.post('/login', { 
        email, 
        password,
        role: selectedRole
      });
      
      const { token: newToken, user: userData } = response.data;
      
      if (!newToken || !userData) {
        throw new Error("Invalid response from server");
      }

      setToken(newToken);
      setUser(userData);
      setRole(userData.role);
      setIsAuthenticated(true);
      
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      toast.success('Login successful!');
      return userData;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
      throw error;
    }
  };

  const value = {
    user,
    token,
    role,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
