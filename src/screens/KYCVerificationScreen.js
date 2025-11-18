import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/apiService';
import API_CONFIG from '../config/api';

const KYCVerificationScreen = ({ navigation, route }) => {
  const { userInfo } = route.params || {};
  const mobileNumber = userInfo?.mobileNumber || '9876543210';
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    panNumber: '',
    nameAsPerPan: '',
    dateOfBirth: '',
  });
  
  const [kycStatus, setKycStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [existingKYC, setExistingKYC] = useState(null);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (mobileNumber) {
      loadExistingKYC();
    }
  }, [mobileNumber]);

  const loadExistingKYC = async () => {
    try {
      const response = await ApiService.makeRequest(`${API_CONFIG.ENDPOINTS.GET_KYC_DETAILS}?unique_id=${mobileNumber}`);
      if (response.success && response.data.kyc_details) {
        const kyc = response.data.kyc_details;
        setExistingKYC(kyc);
        setKycStatus(kyc.status || 'pending');
        
        // Pre-fill form if KYC exists
        setFormData({
          panNumber: kyc.pan_number || '',
          nameAsPerPan: kyc.name_as_per_pan || userName || '',
          dateOfBirth: kyc.date_of_birth || '',
        });
      }
    } catch (error) {
      console.log('Error loading existing KYC:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Auto-format PAN number
    if (field === 'panNumber') {
      const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      setFormData(prev => ({ ...prev, [field]: formatted }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic details validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // KYC details validation
    if (!formData.panNumber.trim()) {
      newErrors.panNumber = 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      newErrors.panNumber = 'PAN must be in format ABCDE1234F';
    }
    
    if (!formData.nameAsPerPan.trim()) {
      newErrors.nameAsPerPan = 'Name as per PAN is required';
    } else if (formData.nameAsPerPan.trim().length < 2) {
      newErrors.nameAsPerPan = 'Name must be at least 2 characters';
    }
    
    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Date must be in YYYY-MM-DD format';
    } else {
      // Validate date format more strictly
      const dateParts = formData.dateOfBirth.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);
      
      // Check if date is valid
      const birthDate = new Date(year, month - 1, day);
      if (birthDate.getFullYear() !== year || 
          birthDate.getMonth() !== month - 1 || 
          birthDate.getDate() !== day) {
        newErrors.dateOfBirth = 'Please enter a valid date (YYYY-MM-DD)';
      } else {
        // Check age
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          newErrors.dateOfBirth = 'You must be at least 18 years old';
        }
      }
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
      // First save basic user details
      const userData = {
        mobile_number: mobileNumber,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
      };
      
      const userResponse = await ApiService.makeRequest(API_CONFIG.ENDPOINTS.SAVE_USER_INFO, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (!userResponse.success) {
        Alert.alert('Error', 'Failed to save user details. Please try again.');
        return;
      }
      
      // Then save KYC details
      const kycData = {
        unique_id: mobileNumber, // Use mobile number as unique ID
        panNumber: formData.panNumber.trim(),
        nameAsPerPan: formData.nameAsPerPan.trim(),
        dateOfBirth: formData.dateOfBirth,
        status: 'pending',
      };
      
      console.log('📝 KYC Screen - Submitting KYC data:', kycData);
      const response = await ApiService.makeRequest(API_CONFIG.ENDPOINTS.UPDATE_KYC_DETAILS, {
        method: 'POST',
        body: JSON.stringify(kycData),
      });
      
      console.log('📝 KYC Screen - API Response:', response);
      
      if (response.success) {
        // Login user with auth context after KYC completion
        const loginResult = await login({
          mobileNumber: mobileNumber,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          isVerified: true
        });

        if (loginResult.success) {
          // Check if it's a fallback response
          const isFallback = response.data?.source === 'local_demo' || response.data?.source === 'local_fallback';
          const message = isFallback 
            ? 'Your profile has been created and KYC verification submitted successfully (Demo Mode). Welcome to GoldApp!'
            : 'Your profile has been created and KYC verification submitted successfully. Welcome to GoldApp!';
          
          Alert.alert(
            'Profile & KYC Complete!',
            message,
            [
              {
                text: 'Go to Dashboard',
                onPress: () => navigation.replace('Dashboard', {
                  userInfo: {
                    mobileNumber: mobileNumber,
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    email: formData.email.trim(),
                  }
                }),
              },
            ]
          );
        } else {
          Alert.alert('Login Error', 'Profile saved but failed to login. Please try again.');
        }
      } else {
        console.log('❌ KYC Screen - API Error:', response);
        Alert.alert('Error', response.message || 'Failed to submit KYC');
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      
      // Check if it's a network error or API error
      let errorMessage = 'Failed to submit KYC. Please try again.';
      
      if (error.message && error.message.includes('HTTP 429')) {
        errorMessage = 'KYC service is temporarily unavailable due to high demand. Your data has been saved locally and will be processed when the service is available.';
      } else if (error.message && error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert('KYC Submission Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip KYC Verification?',
      'You can complete your KYC verification later from the profile section.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            try {
              // If we're already authenticated, just go to dashboard
              if (isAuthenticated) {
                navigation.replace('Dashboard');
                return;
              }

              // Otherwise navigate back to login / splash flow
              navigation.replace('MobileLogin');
            } catch (error) {
              console.error('Skip KYC error:', error);
              Alert.alert('Error', 'Unable to skip KYC right now. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending';
      default: return 'Not Submitted';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>KYC Verification</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* KYC Icon */}
          <View style={styles.kycIconContainer}>
            <Text style={styles.kycIcon}>🛡️</Text>
            <Text style={styles.subtitle}>Complete your KYC for secure transactions</Text>
          </View>

          {/* Current Status */}
          {existingKYC && (
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Current KYC Status</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(kycStatus) }]}>
                  <Text style={styles.statusText}>{getStatusText(kycStatus)}</Text>
                </View>
              </View>
              {existingKYC.submitted_at && (
                <Text style={styles.statusDate}>
                  Submitted: {new Date(existingKYC.submitted_at).toLocaleDateString()}
                </Text>
              )}
              {existingKYC.rejection_reason && (
                <Text style={styles.rejectionReason}>
                  Reason: {existingKYC.rejection_reason}
                </Text>
              )}
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Basic Details</Text>
            
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
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
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
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
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
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <Text style={styles.sectionTitle}>KYC Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PAN Number *</Text>
              <TextInput
                style={[styles.input, errors.panNumber && styles.inputError]}
                value={formData.panNumber}
                onChangeText={(value) => handleInputChange('panNumber', value)}
                placeholder="ABCDE1234F"
                placeholderTextColor="#999"
                maxLength={10}
                autoCapitalize="characters"
              />
              {errors.panNumber && <Text style={styles.errorText}>{errors.panNumber}</Text>}
              <Text style={styles.helpText}>Enter your 10-digit PAN number</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name as per PAN *</Text>
              <TextInput
                style={[styles.input, errors.nameAsPerPan && styles.inputError]}
                value={formData.nameAsPerPan}
                onChangeText={(value) => handleInputChange('nameAsPerPan', value)}
                placeholder="Enter name exactly as on PAN card"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
              {errors.nameAsPerPan && <Text style={styles.errorText}>{errors.nameAsPerPan}</Text>}
              <Text style={styles.helpText}>Name should match exactly with your PAN card</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TextInput
                style={[styles.input, errors.dateOfBirth && styles.inputError]}
                value={formData.dateOfBirth}
                onChangeText={(value) => handleInputChange('dateOfBirth', value)}
                placeholder="YYYY-MM-DD (e.g., 1998-12-28)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={10}
              />
              {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
              <Text style={styles.helpText}>Date of birth as per PAN card (Format: YYYY-MM-DD)</Text>
            </View>
          </View>

          {/* Information Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📋 Important Information</Text>
            <Text style={styles.infoText}>
              • KYC verification is mandatory for gold trading{'\n'}
              • Verification may take up to 48 hours{'\n'}
              • You will receive status updates via SMS{'\n'}
              • Ensure all details match your PAN card exactly
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : existingKYC ? 'Update KYC' : 'Submit KYC'}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff9e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  kycIconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  kycIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B4513',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#fff9e3',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusLabel: {
    fontSize: 14,
    color: '#8B4513',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusDate: {
    fontSize: 12,
    color: '#8B4513',
    marginTop: 5,
  },
  rejectionReason: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 5,
    fontStyle: 'italic',
  },
  form: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff9e3',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#8B4513',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 5,
  },
  helpText: {
    color: '#8B4513',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#fff9e3',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#8B4513',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default KYCVerificationScreen;
