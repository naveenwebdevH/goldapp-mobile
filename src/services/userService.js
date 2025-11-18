// User Service for Dynamic User Management
import ApiService from './apiService';

class UserService {
  // Get user ID for any mobile number
  static async getUserId(mobileNumber) {
    try {
      const response = await ApiService.makeRequest('/users/get-user-id.php', {
        method: 'POST',
        body: JSON.stringify({
          mobile: mobileNumber
        })
      });
      
      if (response.success) {
        return response.data.user;
      } else {
        throw new Error(response.message || 'Failed to get user ID');
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
      throw error;
    }
  }
  
  // Register new user
  static async registerUser(userData) {
    try {
      const response = await ApiService.makeRequest('/users/register.php', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (response.success) {
        return response.data.user;
      } else {
        throw new Error(response.message || 'Failed to register user');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }
  
  // Get user profile
  static async getUserProfile(mobileNumber) {
    try {
      const user = await this.getUserId(mobileNumber);
      return user;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }
  
  // Update user profile
  static async updateUserProfile(userId, profileData) {
    try {
      const response = await ApiService.makeRequest('/users/update.php', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          ...profileData
        })
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
}

export default UserService;



