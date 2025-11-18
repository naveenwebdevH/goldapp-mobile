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
import ApiService from '../services/apiService';
import API_CONFIG from '../config/api';

const EmailOTPScreen = ({ navigation, route }) => {
  const { userInfo, testOTP } = route.params || {};
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    // Start countdown timer
    startCountdown();
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOTPChange = (value) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(numericValue);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    
    try {
      const response = await ApiService.makeRequest(API_CONFIG.ENDPOINTS.VERIFY_EMAIL_OTP, {
        method: 'POST',
        body: JSON.stringify({
          email: userInfo.email,
          otp: otp,
        }),
      });
      
      if (response.success) {
        Alert.alert(
          'Email Verified!',
          'Your email has been verified successfully. Please complete your KYC verification.',
          [
            {
              text: 'Complete KYC',
              onPress: () => navigation.replace('KYCVerification', {
                userInfo: userInfo,
              }),
            },
          ]
        );
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Email OTP verification error:', error);
      Alert.alert('Error', `Verification failed: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) {
      Alert.alert('Please Wait', `You can resend OTP in ${countdown} seconds`);
      return;
    }

    setResendLoading(true);
    
    try {
      const response = await ApiService.makeRequest(API_CONFIG.ENDPOINTS.SEND_EMAIL_OTP, {
        method: 'POST',
        body: JSON.stringify({
          email: userInfo.email,
        }),
      });
      
      if (response.success) {
        Alert.alert('OTP Sent', 'A new OTP has been sent to your email');
        startCountdown();
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', `Failed to send OTP: ${error.message || 'Please try again.'}`);
    } finally {
      setResendLoading(false);
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
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit OTP to{'\n'}
            <Text style={styles.email}>{userInfo?.email}</Text>
            {testOTP && (
              <Text style={styles.testOTP}>
                {'\n\n'}For testing: OTP is {testOTP}
              </Text>
            )}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={handleOTPChange}
              placeholder="000000"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
              fontSize={24}
              letterSpacing={8}
            />
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendSection}>
            <Text style={styles.resendText}>
              Didn't receive the OTP?{' '}
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Resend in {countdown}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={resendLoading}
                >
                  <Text style={styles.resendLink}>
                    {resendLoading ? 'Sending...' : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              )}
            </Text>
          </View>
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
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  email: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  testOTP: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: 'bold',
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  otpInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 20,
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: '#2c3e50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendSection: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  countdownText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  resendLink: {
    color: '#3498db',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default EmailOTPScreen;
