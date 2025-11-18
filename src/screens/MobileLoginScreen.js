import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ApiService from '../services/apiService';

const { width, height } = Dimensions.get('window');

const MobileLoginScreen = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const inputRef = useRef(null);

  React.useEffect(() => {
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
  }, []);

  const validateMobile = (mobileNumber) => {
    // Remove any non-digit characters
    const cleaned = mobileNumber.replace(/\D/g, '');
    
    // Check if it's a valid 10-digit Indian mobile number
    if (cleaned.length === 10) {
      return cleaned;
    }
    return null;
  };

  const handleSendOTP = async () => {
    const validatedMobile = validateMobile(mobile);
    
    if (!validatedMobile) {
      Alert.alert(
        'Invalid Mobile Number',
        'Please enter a valid 10-digit mobile number.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('📱 MobileLoginScreen - Sending OTP to:', validatedMobile);
      const response = await ApiService.sendOTP(validatedMobile);
      console.log('📱 MobileLoginScreen - OTP Response:', response);
      
      if (response.success) {
        Alert.alert(
          'OTP Sent',
          `OTP has been sent to +91 ${validatedMobile}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to OTP verification screen
                navigation.navigate('OTPVerification', { 
                  mobile: validatedMobile 
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP Error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert(
        'Error',
        `Failed to send OTP: ${error.message || 'Network error'}. Please check your internet connection and try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Splash');
    }
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
        <Text style={styles.headerTitle}>Login</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View 
          style={[
            styles.content,
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
              <Text style={styles.logoEmoji}>🧈</Text>
            </View>
            <Text style={styles.title}>One Stop Solution for all your Digital Gold Investment</Text>
            <Text style={styles.subtitle}>Your Digital Gold Investment Partner</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Enter Your Mobile Number</Text>
            <Text style={styles.formSubtitle}>
              We'll send you a verification code
            </Text>

            {/* Mobile Input */}
            <View style={styles.inputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                ref={inputRef}
                style={styles.mobileInput}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#999999"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={handleSendOTP}
              />
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[
                styles.sendOTPButton,
                (!mobile || mobile.length !== 10 || isLoading) && styles.disabledButton
              ]}
              onPress={handleSendOTP}
              disabled={!mobile || mobile.length !== 10 || isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.buttonText}>Sending OTP...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            {/* Terms and Privacy */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.linkText}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🛡️</Text>
              <Text style={styles.featureText}>100% Secure</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>⚡</Text>
              <Text style={styles.featureText}>Instant Trading</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>📈</Text>
              <Text style={styles.featureText}>Live Rates</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
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
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  countryCode: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    color: 'black',
    fontWeight: '500',
  },
  mobileInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: 'black',
  },
  sendOTPButton: {
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
  termsContainer: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: 'black',
    textDecorationLine: 'underline',
    fontWeight:'bold',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  featureText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
});

export default MobileLoginScreen;