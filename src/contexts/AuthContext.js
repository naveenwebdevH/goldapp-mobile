import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if user has valid token
      const token = await ApiService.getAuthToken();
      console.log('🔐 AuthContext - Token exists:', !!token);
      
      if (token) {
        try {
          // Verify token with backend
          console.log('🔐 AuthContext - Verifying token with backend...');
          const response = await ApiService.makeRequest('/user/profile.php');
          console.log('🔐 AuthContext - Backend response:', response);
          
          if (response && response.success && response.data) {
            console.log('✅ AuthContext - Token valid, user authenticated');
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            console.log('❌ AuthContext - Token invalid, logging out');
            // Token is invalid, clear it
            await logout();
          }
        } catch (apiError) {
          console.log('❌ AuthContext - API call failed:', apiError.message);
          // If API call fails, assume not authenticated
          await logout();
        }
      } else {
        console.log('❌ AuthContext - No token found');
        // No token found
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.log('❌ AuthContext - Auth check failed:', error.message);
      // If auth check fails, assume not authenticated
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Clear all stored data
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      
      setUser(null);
      setIsAuthenticated(false);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    AsyncStorage.setItem('user_data', JSON.stringify(userData));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
