import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth.api';
import { getToken, setToken, removeToken, isAuthenticated } from '../utils/token';
import { clearGuestCart } from '../utils/cartStorage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const userData = await authAPI.getMe();
          // Backend returns user object directly from response.data.data
          if (userData && (userData._id || userData.id)) {
            setUser(userData);
          }
        } catch (error) {
          // Don't log errors if backend is not running - just clear token
          if (error.response) {
            console.error('Auth check failed:', error);
          }
          removeToken();
        }
      }
      setLoading(false);
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (credentials, onSuccess) => {
    try {
      // Login (don't clear guest cart here - CartContext will handle merge)
      const response = await authAPI.login(credentials);

      setToken(response.token);
      setUser({
        _id: response._id,
        name: response.name,
        email: response.email,
      });

      // Don't clear guest cart here - let CartContext handle the merge
      // CartContext will merge and clear after successful merge

      // Callback for any additional actions after login
      if (onSuccess) {
        onSuccess();
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData, onSuccess) => {
    try {
      // Register (don't clear guest cart here - CartContext will handle merge)
      const response = await authAPI.register(userData);

      setToken(response.token);
      setUser({
        _id: response._id,
        name: response.name,
        email: response.email,
      });

      // Don't clear guest cart here - let CartContext handle the merge
      // CartContext will merge and clear after successful merge

      // Callback for any additional actions after registration
      if (onSuccess) {
        onSuccess();
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    // Don't clear guest cart on logout - user might want to continue shopping
    // CartContext will handle switching back to guest cart mode
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

