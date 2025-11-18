import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/apiService';
import API_CONFIG from '../config/api';

const BasicDetailsScreen = ({ navigation, route }) => {
  const { mobileNumber } = route.params || {};
  const safeMobileNumber = mobileNumber || '9876543210';
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = {
        mobile_number: safeMobileNumber,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        created_at: new Date().toISOString(),
      };
      
      console.log('Saving user basic details:', userData);
      
      const response = await ApiService.makeRequest(API_CONFIG.ENDPOINTS.SAVE_USER_INFO, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (response.success) {
        // First save the user info, then send email OTP
        const userInfo = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          mobileNumber: safeMobileNumber,
        };
        
        // Send email OTP
        try {
          const otpResponse = await ApiService.makeRequest(API_CONFIG.ENDPOINTS.SEND_EMAIL_OTP, {
            method: 'POST',
            body: JSON.stringify({
              email: userInfo.email,
            }),
          });
          
          if (otpResponse.success) {
            // Show OTP for testing if available
            // Login user with auth context after saving details
            const loginResult = await login({
              mobileNumber: safeMobileNumber,
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              email: formData.email.trim(),
              isVerified: true
            });

            if (loginResult.success) {
              const otpMessage = otpResponse.data?.otp_for_testing 
                ? `Your profile has been created! Please verify your email with the OTP sent.\n\nFor testing: OTP is ${otpResponse.data.otp_for_testing}`
                : 'Your profile has been created! Please verify your email with the OTP sent.';
                
              Alert.alert(
                'Profile Created!',
                otpMessage,
                [
                  {
                    text: 'Verify Email',
                    onPress: () => navigation.navigate('EmailOTP', {
                      userInfo: userInfo,
                      testOTP: otpResponse.data?.otp_for_testing, // Pass OTP for testing
                    }),
                  },
                ]
              );
            } else {
              Alert.alert('Login Error', 'Profile saved but failed to login. Please try again.');
            }
          } else {
            // If email OTP fails, still proceed to dashboard
            Alert.alert(
              'Details Saved!',
              'Your basic details have been saved successfully.',
              [
                {
                  text: 'Continue to Dashboard',
                  onPress: () => navigation.replace('Dashboard', {
                    userInfo: userInfo,
                  }),
                },
              ]
            );
          }
        } catch (otpError) {
          console.error('Email OTP error:', otpError);
          // If email OTP fails, still proceed to dashboard
          Alert.alert(
            'Details Saved!',
            'Your basic details have been saved successfully.',
            [
              {
                text: 'Continue to Dashboard',
                onPress: () => navigation.replace('Dashboard', {
                  userInfo: userInfo,
                }),
              },
            ]
          );
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to save details');
      }
    } catch (error) {
      console.error('Save user info error:', error);
      Alert.alert('Error', `Failed to save details: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffebb9" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Please provide your basic details to continue
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              placeholder="Enter your first name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              placeholder="Enter your last name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : 'Save & Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffebb9',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#2c3e50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BasicDetailsScreen;
