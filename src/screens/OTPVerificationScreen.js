import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/apiService';

const { width, height } = Dimensions.get('window');

const OTPVerificationScreen = ({ navigation, route }) => {
  const { mobile } = route.params;
  const { login } = useAuth();
  const mobileNumber = mobile; // Alias for consistency
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Start animations
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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Start resend timer
    startResendTimer();
  }, []);

  const startResendTimer = () => {
    setResendTimer(60);
    setCanResend(false);
    
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode = null) => {
    const otpToVerify = otpCode || otp.join('');
    
    if (otpToVerify.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await ApiService.verifyOTP(mobile, otpToVerify);
      
      if (response.success) {
        // Store token and user data
        if (response.data && response.data.token) {
          await ApiService.setAuthToken(response.data.token);
          console.log('Token stored successfully');
        }
        
        // Check KYC status and redirect accordingly
        const kycStatus = response.data?.kyc_status || 'pending';
        console.log('🔍 KYC Status:', kycStatus);
        
        if (kycStatus === 'approved') {
          // User has completed KYC, go to dashboard
          Alert.alert(
            'Welcome Back!',
            'OTP verified successfully. You are logged in.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  // Login user and navigate to dashboard
                  login({
                    mobileNumber: mobileNumber,
                    kycStatus: kycStatus
                  });
                  navigation.replace('Dashboard');
                }
              }
            ]
          );
        } else if (kycStatus === 'pending') {
          // User needs to complete KYC
          Alert.alert(
            'OTP Verified Successfully!',
            'Please complete your KYC verification to continue.',
            [
              {
                text: 'Complete KYC',
                onPress: () => {
                  // Navigate to KYC screen
                  navigation.replace('KYCVerification', {
                    userInfo: {
                      mobileNumber: mobileNumber,
                    }
                  });
                }
              }
            ]
          );
        } else {
          // KYC rejected or other status
          Alert.alert(
            'KYC Required',
            'Your KYC verification is required to continue. Please complete it.',
            [
              {
                text: 'Complete KYC',
                onPress: () => {
                  navigation.replace('KYCVerification', {
                    userInfo: {
                      mobileNumber: mobileNumber,
                    }
                  });
                }
              }
            ]
          );
        }
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid OTP');
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to verify OTP. Please try again.'
      );
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    
    try {
      const response = await ApiService.sendOTP(mobile);
      
      if (response.success) {
        Alert.alert('OTP Sent', 'New OTP has been sent to your mobile number');
        startResendTimer();
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP Error:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatMobile = (mobileNumber) => {
    return `+91 ${mobileNumber.slice(0, 5)} ${mobileNumber.slice(5)}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <View style={styles.backgroundGradient} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify OTP</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Logo and Title */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🔐</Text>
            </View>
            <Text style={styles.title}>Verify Your Number</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{'\n'}
              <Text style={styles.mobileText}>{formatMobile(mobile)}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            <Text style={styles.otpLabel}>Enter Verification Code</Text>
            <View style={styles.otpInputs}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  textAlign="center"
                />
              ))}
            </View>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (!otp.every(digit => digit !== '') || isLoading) && styles.disabledButton
            ]}
            onPress={() => handleVerifyOTP()}
            disabled={!otp.every(digit => digit !== '') || isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.buttonText}>Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the code?{' '}
            </Text>
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={!canResend || isLoading}
            >
              <Text style={[
                styles.resendButton,
                (!canResend || isLoading) && styles.disabledResendButton
              ]}>
                {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Change Number */}
          <TouchableOpacity
            style={styles.changeNumberButton}
            onPress={handleBack}
          >
            <Text style={styles.changeNumberText}>Change Mobile Number</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffeec2',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffeec2',
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
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    lineHeight: 22,
  },
  mobileText: {
    color: 'black',
    fontWeight: '600',
  },
  otpContainer: {
    marginBottom: 30,
  },
  otpLabel: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    marginBottom: 20,
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  verifyButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#666666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  resendButton: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  disabledResendButton: {
    color: '#666666',
  },
  changeNumberButton: {
    alignItems: 'center',
  },
  changeNumberText: {
    fontSize: 14,
    color: '#999999',
    textDecorationLine: 'underline',
  },
});

export default OTPVerificationScreen;
