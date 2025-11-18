import API_CONFIG from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS;
  }

  // Get stored auth token
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Store auth token
  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  }

  // Clear auth token
  async clearAuthToken() {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  // Create form data for Augmont APIs (formdata format)
  createFormData(data) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  }

  // Create URL encoded data for Augmont APIs (urlencoded format)
  createUrlEncodedData(data) {
    const formData = new URLSearchParams();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  }

  // Make Augmont API request
  async makeAugmontRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.AUGMONT_BASE_URL}${endpoint}`;
    const token = await this.getAuthToken();
    
    console.log('🌐 Augmont API - Making request to:', url);
    
    const config = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Augmont API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('💥 Augmont API - Request Error:', error);
      throw error;
    }
  }

  // Make HTTP request
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();
    
    console.log('🌐 API Service - Making request to:', url);
    console.log('🌐 API Service - Base URL:', this.baseURL);
    console.log('🌐 API Service - Endpoint:', endpoint);
    console.log('🌐 API Service - Full URL being called:', url);
    
    const config = {
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 API Service - Using auth token');
    } else {
      console.log('🔓 API Service - No auth token');
    }

    try {
      console.log('📡 API Service - Fetching URL:', url);
      console.log('📡 API Service - Config:', config);
      
      const response = await fetch(url, config);
      console.log('📡 API Service - Response status:', response.status);
      console.log('📡 API Service - Response headers:', response.headers);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      console.log('📡 API Service - Content-Type:', contentType);
      
      // Clone the response to avoid "Already read" error
      const responseClone = response.clone();
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
          console.log('📡 API Service - Response data (JSON):', data);
        } catch (jsonError) {
          console.log('📡 API Service - JSON parse error:', jsonError);
          const textData = await responseClone.text();
          console.log('📡 API Service - Raw response:', textData);
          data = { success: false, message: 'JSON parse error', raw: textData };
        }
      } else {
        const textData = await response.text();
        console.log('📡 API Service - Response data (Text):', textData);
        
        // Try to parse as JSON even if content-type is not application/json
        try {
          data = JSON.parse(textData);
          console.log('📡 API Service - Parsed as JSON despite content-type:', data);
        } catch (parseError) {
          console.log('📡 API Service - Not JSON, treating as text');
          data = { success: false, message: 'Invalid response format', raw: textData };
        }
      }
      
      if (!response.ok) {
        console.log('❌ API Service - Response not OK:', response.status);
        console.log('❌ API Service - Response URL:', response.url);
        console.log('❌ API Service - Response status text:', response.statusText);
        console.log('❌ API Service - Response data:', data);
        
        // If we have valid JSON data even with non-OK status, return it
        if (data && typeof data === 'object' && data.success !== undefined) {
          console.log('📡 API Service - Returning data despite non-OK status');
          return data;
        }
        
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      
      console.log('✅ API Service - Request successful');
      return data;
    } catch (error) {
      console.error('💥 API Service - Request Error:', error);
      console.error('💥 API Service - Error message:', error.message);
      
      // Handle JSON parse errors specifically
      if (error.message.includes('JSON Parse error')) {
        console.log('🔄 API Service - JSON Parse error, returning fallback');
        return {
          success: false,
          message: 'Invalid response format from server',
          error: error.message
        };
      }
      
      // Return fallback data for specific endpoints
      if (endpoint === '/gold/rates.php') {
        console.log('🔄 API Service - Returning fallback gold rates');
        return {
          success: true,
          data: {
            current: {
              buy_price: 6100,
              sell_price: 6000,
              source: 'fallback',
              updated_at: new Date().toISOString()
            }
          }
        };
      }
      
      throw error;
    }
  }

  // Authentication APIs
  async augmontLogin(credentials) {
    console.log('🔐 Augmont Login with credentials:', credentials);
    const result = await this.makeAugmontRequest(API_CONFIG.ENDPOINTS.AUGMONT_LOGIN, {
      method: 'POST',
      body: this.createFormData(credentials),
    });
    console.log('🔐 Augmont Login Result:', result);
    return result;
  }

  async sendOTP(mobile) {
    console.log('📱 Sending OTP to mobile:', mobile);
    const result = await this.makeRequest(API_CONFIG.ENDPOINTS.SEND_OTP, {
      method: 'POST',
      body: JSON.stringify({ mobile }),
    });
    console.log('📱 OTP Send Result:', result);
    return result;
  }

  async verifyOTP(mobile, otp) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify({ mobile, otp }),
    });
  }

  // User Bank Management APIs (Augmont Format)
  async createUserBank(bankData, uniqueId) {
    const endpoint = API_CONFIG.ENDPOINTS.CREATE_USER_BANK.replace('{{unique_id}}', uniqueId);
    return this.makeAugmontRequest(endpoint, {
      method: 'POST',
      body: this.createUrlEncodedData(bankData),
    });
  }

  async getUserBanks(uniqueId) {
    return this.makeRequest(`/users/banks/list.php?unique_id=${uniqueId}`, {
      method: 'GET',
    });
  }

  async updateUserBank(bankId, bankData, uniqueId) {
    const endpoint = API_CONFIG.ENDPOINTS.UPDATE_USER_BANK
      .replace('{{unique_id}}', uniqueId)
      .replace('{{user_bank_id}}', bankId);
    
    // Add _method=PUT for Augmont API
    const formData = this.createUrlEncodedData({
      ...bankData,
      _method: 'PUT'
    });
    
    return this.makeAugmontRequest(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteUserBank(bankId, uniqueId) {
    const endpoint = API_CONFIG.ENDPOINTS.DELETE_USER_BANK
      .replace('{{unique_id}}', uniqueId)
      .replace('{{user_bank_id}}', bankId);
    
    return this.makeAugmontRequest(endpoint, {
      method: 'DELETE',
    });
  }

  // User APIs
  async getUserProfile() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.USER_PROFILE);
  }

  async updateUserProfile(profileData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.USER_PROFILE, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getDashboard() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.USER_DASHBOARD);
  }

  async getTransactions(type = 'all', limit = 50, offset = 0) {
    const params = new URLSearchParams({
      type,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.USER_TRANSACTIONS}?${params}`);
  }

  // Gold APIs
  async getGoldRates() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.GOLD_RATES);
  }

  async buyGold(amountInr, grams = null) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.BUY_GOLD, {
      method: 'POST',
      body: JSON.stringify({ 
        amount_inr: amountInr,
        grams: grams 
      }),
    });
  }

  async sellGold(grams, amountInr = null) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.SELL_GOLD, {
      method: 'POST',
      body: JSON.stringify({ 
        grams: grams,
        amount_inr: amountInr 
      }),
    });
  }

  // SIP APIs
  async createSIP(sipData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.CREATE_SIP, {
      method: 'POST',
      body: JSON.stringify(sipData),
    });
  }

  // KYC APIs
  async verifyKYC() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.VERIFY_KYC, {
      method: 'POST',
    });
  }

  // User Profile & KYC Methods
  async createUser(userData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.CREATE_USER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserProfile(uniqueId) {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.GET_USER_PROFILE}?unique_id=${uniqueId}`);
  }

  async updateUser(userData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.UPDATE_USER, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getKYCDetails(uniqueId) {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.GET_KYC_DETAILS}?unique_id=${uniqueId}`);
  }

  async updateKYCDetails(kycData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.UPDATE_KYC_DETAILS, {
      method: 'POST',
      body: JSON.stringify(kycData),
    });
  }

  // Master Data Methods
  async getStates() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.GET_STATES);
  }

  async getCities(stateId) {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.GET_CITIES}?stateId=${stateId}`);
  }

  // Additional methods for new screens
  async getUserTransactions(type = 'all', limit = 50, offset = 0) {
    const params = new URLSearchParams({
      type,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.USER_TRANSACTIONS}?${params}`);
  }

  async getUserProfileData() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.USER_PROFILE);
  }

  async updateUserProfileData(profileData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.USER_PROFILE, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getUserBanks(uniqueId) {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.GET_USER_BANKS}?unique_id=${uniqueId}`);
  }

  async createUserBank(bankData, uniqueId) {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.CREATE_USER_BANK}?unique_id=${uniqueId}`, {
      method: 'POST',
      body: JSON.stringify(bankData),
    });
  }

  async updateUserBank(bankId, bankData, uniqueId) {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.UPDATE_USER_BANK}?bank_id=${bankId}&unique_id=${uniqueId}`, {
      method: 'POST',
      body: JSON.stringify(bankData),
    });
  }

  async deleteUserBank(bankId, uniqueId) {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.DELETE_USER_BANK}?bank_id=${bankId}&unique_id=${uniqueId}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();

