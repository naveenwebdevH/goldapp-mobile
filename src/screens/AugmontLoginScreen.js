import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  SafeAreaView,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import ApiService from '../services/apiService';

const AugmontLoginScreen = ({ navigation }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleLogin = async () => {
    if (!credentials.email || !credentials.password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 Attempting Augmont login with:', credentials);
      
      const response = await ApiService.augmontLogin(credentials);
      
      if (response.success || response.token) {
        // Store the token
        await ApiService.setAuthToken(response.token || response.access_token);
        
        Alert.alert('Success', 'Login successful!', [
          { text: 'OK', onPress: () => navigation.replace('Dashboard') }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    try {
      setLoading(true);
      const baseURL = 'https://uat-api.augmontgold.com/api/merchant/v1';
      
      const response = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email || 'test@example.com',
          password: credentials.password || 'test123'
        })
      });
      
      const data = await response.json();
      
      Alert.alert(
        'API Test Result', 
        `Status: ${response.status}\n\nResponse: ${JSON.stringify(data, null, 2)}`
      );
    } catch (error) {
      Alert.alert('API Test Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Augmont API Test</Text>
          <Text style={styles.subtitle}>Test authentication with Augmont APIs</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Merchant Email</Text>
            <TextInput
              style={styles.input}
              value={credentials.email}
              onChangeText={(value) => setCredentials(prev => ({ ...prev, email: value }))}
              placeholder="Enter merchant email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Merchant Password</Text>
            <TextInput
              style={styles.input}
              value={credentials.password}
              onChangeText={(value) => setCredentials(prev => ({ ...prev, password: value }))}
              placeholder="Enter merchant password"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testButton}
            onPress={testAPI}
            disabled={loading}
          >
            <Text style={styles.testButtonText}>
              {loading ? 'Testing...' : 'Test API Connection'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back to App</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffeec2',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B4513',
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff9e3',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#8B4513',
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  loginButton: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#2c3e50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#fff9e3',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  backButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AugmontLoginScreen;
