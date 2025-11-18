import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  Image,
  PanResponder
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import ProtectedRoute from './src/components/ProtectedRoute';
import MobileLoginScreen from './src/screens/MobileLoginScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import KYCVerificationScreen from './src/screens/KYCVerificationScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GoldBuyScreen from './src/screens/GoldBuyScreen';
import GoldSellScreen from './src/screens/GoldSellScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BankManagementScreen from './src/screens/BankManagementScreen';
import AugmontLoginScreen from './src/screens/AugmontLoginScreen';

const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();

// Splash Screen Component
const SplashScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));
  const [translateX] = useState(new Animated.Value(0));

  const slides = [
    {
      id: 1,
      image: require('./assets/images/slide1.jpeg'),
    },
    {
      id: 2,
      image: require('./assets/images/slide2.jpeg'),
    },
    {
      id: 3,
      image: require('./assets/images/slide3.jpeg'),
    },
    {
      id: 4,
      image: require('./assets/images/slide4.jpeg'),
    },
  ];

  const goToSlide = (slideIndex) => {
    if (slideIndex >= 0 && slideIndex < slides.length) {
      setCurrentSlide(slideIndex);
      // Reset animations for new slide
      fadeAnim.setValue(0);
      slideAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        
        if (Math.abs(dx) > width * 0.3 || Math.abs(vx) > 0.5) {
          if (dx > 0 && currentSlide > 0) {
            // Swipe right - go to previous slide
            goToSlide(currentSlide - 1);
          } else if (dx < 0 && currentSlide < slides.length - 1) {
            // Swipe left - go to next slide
            goToSlide(currentSlide + 1);
          }
        }
        
        // Reset position
        translateX.setValue(0);
      },
    })
  ).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    goToSlide(currentSlide + 1);
  };

  const handleSkip = () => {
    navigation.replace('MobileLogin');
  };

  const currentSlideData = slides[currentSlide];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Full Screen Image with Swipe */}
      <Animated.View
        style={[
          styles.fullScreenImageContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })},
              { translateX: translateX },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Image 
          source={currentSlideData.image} 
          style={styles.fullScreenImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index === currentSlide ? '#D4AF37' : '#D4AF3750',
                  width: index === currentSlide ? 20 : 10,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {currentSlide < slides.length - 1 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.getStartedButton} onPress={handleSkip}>
              <Text style={styles.getStartedText}>Get Started</Text>
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// Main App Component with Authentication
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={isAuthenticated ? "Dashboard" : "Splash"}
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        {!isAuthenticated ? (
          // Authentication Flow
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="MobileLogin" component={MobileLoginScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="KYCVerification" component={KYCVerificationScreen} />
          </>
        ) : (
          // Authenticated Flow
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="GoldBuy" component={GoldBuyScreen} />
            <Stack.Screen name="GoldSell" component={GoldSellScreen} />
            <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="BankManagement" component={BankManagementScreen} />
            <Stack.Screen name="AugmontLogin" component={AugmontLoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Root App Component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  fullScreenImageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    maxWidth: width,
    maxHeight: height,
  },
  bottomSection: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressDot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    marginRight: 8,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: '#D4AF37',
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  arrowText: {
    fontSize: 18,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffeec2',
  },
  loadingText: {
    fontSize: 18,
    color: '#2c3e50',
    marginTop: 10,
  },
});