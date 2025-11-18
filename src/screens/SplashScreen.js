import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import LinearGradient from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [progressAnim] = useState(new Animated.Value(0));

  const slides = [
    {
      id: 1,
      
      subtitle: 'Your Digital Gold Investment Partner',
      description: 'Start your journey towards secure and profitable gold investments',
      icon: '💎',
      color: ['#FFD700', '#FFA500'],
      textColor: '#1a1a2e',
    },
    {
      id: 2,
      title: 'Real-time Gold Rates',
      subtitle: 'Live Market Prices',
      description: 'Get instant updates on gold and silver rates from Augmont',
      icon: 'trending-up',
      color: ['#4CAF50', '#45a049'],
      textColor: '#FFFFFF',
    },
    {
      id: 3,
      title: 'Secure Trading',
      subtitle: 'Buy & Sell Gold Safely',
      description: 'Trade gold with complete security and transparency',
      icon: 'shield-checkmark',
      color: ['#2196F3', '#1976D2'],
      textColor: '#FFFFFF',
    },
    {
      id: 4,
      title: 'Smart Investments',
      subtitle: 'SIP & Fixed Deposits',
      description: 'Grow your wealth with systematic investment plans',
      icon: 'analytics',
      color: ['#9C27B0', '#7B1FA2'],
      textColor: '#FFFFFF',
    },
  ];

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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance slides
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Navigate to main app after all slides
    const navigationTimeout = setTimeout(() => {
      navigation.replace('MobileLogin');
    }, 12000); // 4 slides × 3 seconds

    return () => {
      clearInterval(slideInterval);
      clearTimeout(navigationTimeout);
    };
  }, []);

  const handleSkip = () => {
    navigation.replace('MobileLogin');
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      // Reset progress bar
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start();
    } else {
      navigation.replace('MobileLogin');
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <LinearGradient
      colors={currentSlideData.color}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: currentSlideData.textColor }]}>
          Skip
        </Text>
      </TouchableOpacity>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })},
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={[styles.iconEmoji, { color: currentSlideData.textColor }]}>
            {currentSlideData.icon}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: currentSlideData.textColor }]}>
          {currentSlideData.title}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: currentSlideData.textColor }]}>
          {currentSlideData.subtitle}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: currentSlideData.textColor }]}>
          {currentSlideData.description}
        </Text>
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
                  backgroundColor: index === currentSlide
                    ? currentSlideData.textColor
                    : 'rgba(255, 255, 255, 0.3)',
                },
              ]}
            />
          ))}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: currentSlideData.textColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {currentSlide < slides.length - 1 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={[styles.nextButtonText, { color: currentSlideData.textColor }]}>
                Next
              </Text>
              <Text style={[styles.arrowText, { color: currentSlideData.textColor }]}>
                →
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.getStartedButton} onPress={handleSkip}>
              <Text style={[styles.getStartedText, { color: currentSlideData.textColor }]}>
                Get Started
              </Text>
              <Text style={[styles.arrowText, { color: currentSlideData.textColor }]}>
                →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
    padding: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconEmoji: {
    fontSize: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  bottomSection: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default SplashScreen;
