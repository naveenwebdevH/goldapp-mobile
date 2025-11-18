import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import LinearGradient from 'expo-linear-gradient';

const SimpleSplashScreen = ({ navigation }) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Navigate after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('MobileLogin');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#FFD700', '#FFA500']}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.diamondEmoji}>💎</Text>
        <Text style={styles.title}>GoldApp</Text>
        <Text style={styles.subtitle}>Your Digital Gold Investment</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  diamondEmoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#1a1a2e',
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default SimpleSplashScreen;
