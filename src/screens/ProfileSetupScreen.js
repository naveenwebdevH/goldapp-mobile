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
import ApiService from '../services/apiService';
import API_CONFIG from '../config/api';

const ProfileSetupScreen = ({ navigation, route }) => {
  const { mobileNumber } = route.params || {};
  const safeMobileNumber = mobileNumber || '9876543210';
  
  const [formData, setFormData] = useState({
    uniqueId: '',
    userName: '',
    emailId: '',
    userCity: '',
    userState: '',
    userPincode: '',
    dateOfBirth: '',
    nomineeName: '',
    nomineeDateOfBirth: '',
    nomineeRelation: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // State and city ID mapping
  const stateCityMapping = {
    'Maharashtra': {
      stateId: 'ep9kJ7Px',
      cities: {
        'Mumbai': '1GXDPyX2',
        'Pune': '2yqE2a7z',
        'Nashik': 'km9Nmw7A',
        'Nagpur': 'lk7J8vXP',
        'Aurangabad': 'JyX5nwqM',
        'Solapur': 'o59R5P7A',
        'Amravati': 'ep9knn7P',
        'Kolhapur': 'mVqoyk9D',
        'Sangli': 'joXpwk94',
        'Malegaon': 'wk9PD39n'
      }
    },
    'Telangana': {
      stateId: 'zy94Vq4k',
      cities: {
        'Hyderabad': 'KR9aVwXW',
        'Warangal': 'aBqvnYq0',
        'Nizamabad': 'Pa7zmBqv',
        'Khammam': 'Kd9Bn69p',
        'Karimnagar': '1LqK8k7V',
        'Ramagundam': 'eN9b5p7D',
        'Mahabubnagar': 'Q27LdA7b',
        'Nalgonda': 'WA7yy37k',
        'Adilabad': 'bv9mwNq5',
        'Suryapet': 'joXpwk94'
      }
    },
    'Karnataka': {
      stateId: 'eyqMQqYd',
      cities: {
        'Bangalore': 'B1qVZqPG',
        'Mysore': 'eE72O9nm',
        'Hubli': 'awXwn9lA',
        'Mangalore': 'xEq3d7Lo',
        'Belgaum': 'Do7Wjq3d',
        'Gulbarga': '62Xg57W0',
        'Davanagere': 'lk7J5qPr',
        'Bellary': 'gyqOP7mY',
        'Bijapur': 'JyX5zqMW',
        'Shimoga': 'ep9kJ7Px'
      }
    },
    'Tamil Nadu': {
      stateId: 'mVqoM9DM',
      cities: {
        'Chennai': 'J271B9aj',
        'Coimbatore': 'Be9AP72w',
        'Madurai': 'ZVXe5Xov',
        'Tiruchirapalli': 'BJXdYqYZ',
        'Salem': 'AR7YPqDj',
        'Tirunelveli': 'LQ78NXmy',
        'Tiruppur': 'WV906qDv',
        'Erode': 'PJ7nDXlY',
        'Vellore': 'YO9jE73B',
        'Thoothukudi': 'mVqoM9DM'
      }
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    generateUniqueId();
  }, []);

  const generateUniqueId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const uniqueId = `user_${timestamp}_${random}`;
    console.log('Generated unique ID:', uniqueId);
    setFormData(prev => ({ ...prev, uniqueId }));
  };

  const getStateCityIds = (stateName, cityName) => {
    // Find the state (case-insensitive)
    const stateKey = Object.keys(stateCityMapping).find(
      key => key.toLowerCase() === stateName.toLowerCase()
    );
    
    if (!stateKey) {
      console.warn(`State "${stateName}" not found in mapping, using default Maharashtra`);
      return {
        stateId: stateCityMapping['Maharashtra'].stateId,
        cityId: stateCityMapping['Maharashtra'].cities['Mumbai']
      };
    }
    
    const stateData = stateCityMapping[stateKey];
    
    // Find the city (case-insensitive)
    const cityKey = Object.keys(stateData.cities).find(
      key => key.toLowerCase() === cityName.toLowerCase()
    );
    
    if (!cityKey) {
      console.warn(`City "${cityName}" not found in ${stateKey}, using first available city`);
      const firstCity = Object.keys(stateData.cities)[0];
      return {
        stateId: stateData.stateId,
        cityId: stateData.cities[firstCity]
      };
    }
    
    return {
      stateId: stateData.stateId,
      cityId: stateData.cities[cityKey]
    };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.userName.trim()) {
      newErrors.userName = 'Full name is required';
    }
    if (!formData.emailId.trim()) {
      newErrors.emailId = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      newErrors.emailId = 'Please enter a valid email';
    }
    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.nomineeName.trim()) {
      newErrors.nomineeName = 'Nominee name is required';
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
      // Ensure mobile number is exactly 10 digits
      const cleanMobileNumber = safeMobileNumber.replace(/\D/g, '').slice(-10);
      
      // Get correct state and city IDs based on user input
      const stateName = formData.userState.trim() || 'Maharashtra';
      const cityName = formData.userCity.trim() || 'Mumbai';
      const { stateId, cityId } = getStateCityIds(stateName, cityName);
      
      console.log(`Mapping: ${stateName} -> ${stateId}, ${cityName} -> ${cityId}`);
      
      const userData = {
        uniqueId: formData.uniqueId,
        userName: formData.userName.trim(),
        mobileNumber: cleanMobileNumber,
        emailId: formData.emailId.trim(),
        userCity: cityId, // Use correct city ID
        userState: stateId, // Use correct state ID
        userPincode: formData.userPincode.trim() || '400001',
        dateOfBirth: formData.dateOfBirth || '1990-01-01',
        nomineeName: formData.nomineeName.trim(),
        nomineeDateOfBirth: formData.nomineeDateOfBirth || '1995-01-01',
        nomineeRelation: formData.nomineeRelation.trim() || 'Spouse',
        utmSource: 'MOBILE_APP',
        utmMedium: 'DIRECT',
        utmCampaign: 'PROFILE_SETUP',
      };
      
      console.log('Sending user data to backend API:', userData);
      
      const response = await ApiService.makeRequest(API_CONFIG.ENDPOINTS.CREATE_USER, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (response.success) {
        Alert.alert(
          'Profile Created!',
          'Your profile has been created successfully. Now complete your KYC verification.',
          [
            {
              text: 'Continue to KYC',
              onPress: () => navigation.navigate('KYCVerification', {
                uniqueId: formData.uniqueId,
                userName: formData.userName,
                mobileNumber: safeMobileNumber,
              }),
            },
          ]
        );
      } else {
        console.log('Profile creation failed:', response);
        Alert.alert('Error', response.message || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      console.error('Error details:', error.message);
      Alert.alert('Error', `Failed to create profile: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup?',
      'You can complete your profile later from the settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => navigation.navigate('Dashboard'),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Complete Your Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Icon */}
          <View style={styles.profileIconContainer}>
            <Text style={styles.profileIcon}>👤</Text>
            <Text style={styles.subtitle}>Let's get to know you better</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.userName && styles.inputError]}
                value={formData.userName}
                onChangeText={(value) => handleInputChange('userName', value)}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
              {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.emailId && styles.inputError]}
                value={formData.emailId}
                onChangeText={(value) => handleInputChange('emailId', value)}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.emailId && <Text style={styles.errorText}>{errors.emailId}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TextInput
                style={[styles.input, errors.dateOfBirth && styles.inputError]}
                value={formData.dateOfBirth}
                onChangeText={(value) => handleInputChange('dateOfBirth', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
              {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.userCity}
                onChangeText={(value) => handleInputChange('userCity', value)}
                placeholder="Enter your city"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                value={formData.userPincode}
                onChangeText={(value) => handleInputChange('userPincode', value)}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nominee Name *</Text>
              <TextInput
                style={[styles.input, errors.nomineeName && styles.inputError]}
                value={formData.nomineeName}
                onChangeText={(value) => handleInputChange('nomineeName', value)}
                placeholder="Enter nominee's full name"
                placeholderTextColor="#999"
              />
              {errors.nomineeName && <Text style={styles.errorText}>{errors.nomineeName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nominee Date of Birth</Text>
              <TextInput
                style={styles.input}
                value={formData.nomineeDateOfBirth}
                onChangeText={(value) => handleInputChange('nomineeDateOfBirth', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nominee Relation</Text>
              <TextInput
                style={styles.input}
                value={formData.nomineeRelation}
                onChangeText={(value) => handleInputChange('nomineeRelation', value)}
                placeholder="e.g., Spouse, Father, Mother"
                placeholderTextColor="#999"
              />
            </View>
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
              {loading ? 'Creating Profile...' : 'Create Profile'}
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
  profileIconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B4513',
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
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

export default ProfileSetupScreen;