import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';

const SettingsScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    smsAlerts: true,
    emailAlerts: true,
    priceAlerts: true,
    transactionAlerts: true,
    darkMode: false,
    biometricAuth: false,
  });
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadSettings();
    
    // Start animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadSettings = async () => {
    // In a real app, you would load settings from AsyncStorage or API
    // For now, we'll use default values
    console.log('Loading settings...');
  };

  const saveSettings = async (newSettings) => {
    try {
      // In a real app, you would save to AsyncStorage or API
      setSettings(newSettings);
      console.log('Settings saved:', newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleToggle = (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    saveSettings(newSettings);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // Clear cache logic here
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export your transaction data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            // Export data logic here
            Alert.alert('Success', 'Data export started. You will receive an email when ready.');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type DELETE to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    // Delete account logic here
                    Alert.alert('Account Deleted', 'Your account has been deleted');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const renderSettingItem = (title, subtitle, value, onToggle, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#e0d0b0', true: '#8B4513' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const renderActionItem = (title, subtitle, icon, onPress, destructive = false) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.actionLeft}>
        <Text style={styles.actionIcon}>{icon}</Text>
        <View style={styles.actionText}>
          <Text style={[styles.actionTitle, destructive && styles.destructiveText]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Text style={styles.actionArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />
      
      <ScrollView style={styles.scrollView}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Settings</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            {renderSettingItem(
              'Push Notifications',
              'Receive app notifications',
              settings.notifications,
              () => handleToggle('notifications'),
              '🔔'
            )}
            
            {renderSettingItem(
              'SMS Alerts',
              'Get important updates via SMS',
              settings.smsAlerts,
              () => handleToggle('smsAlerts'),
              '📱'
            )}
            
            {renderSettingItem(
              'Email Alerts',
              'Receive email notifications',
              settings.emailAlerts,
              () => handleToggle('emailAlerts'),
              '📧'
            )}
            
            {renderSettingItem(
              'Price Alerts',
              'Gold price change notifications',
              settings.priceAlerts,
              () => handleToggle('priceAlerts'),
              '💰'
            )}
            
            {renderSettingItem(
              'Transaction Alerts',
              'Transaction status updates',
              settings.transactionAlerts,
              () => handleToggle('transactionAlerts'),
              '📋'
            )}
          </View>

          {/* App Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Preferences</Text>
            
            {renderSettingItem(
              'Dark Mode',
              'Use dark theme',
              settings.darkMode,
              () => handleToggle('darkMode'),
              '🌙'
            )}
            
            {renderSettingItem(
              'Biometric Authentication',
              'Use fingerprint/face ID',
              settings.biometricAuth,
              () => handleToggle('biometricAuth'),
              '👆'
            )}
          </View>

          {/* Data Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            
            {renderActionItem(
              'Clear Cache',
              'Free up storage space',
              '🗑️',
              handleClearCache
            )}
            
            {renderActionItem(
              'Export Data',
              'Download your transaction history',
              '📤',
              handleExportData
            )}
            
            {renderActionItem(
              'Backup Data',
              'Backup to cloud storage',
              '☁️',
              () => Alert.alert('Backup', 'Backup feature coming soon!')
            )}
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            {renderActionItem(
              'Change Password',
              'Update your password',
              '🔒',
              () => Alert.alert('Change Password', 'Password change feature coming soon!')
            )}
            
            {renderActionItem(
              'Two-Factor Authentication',
              'Add extra security',
              '🔐',
              () => Alert.alert('2FA', 'Two-factor authentication coming soon!')
            )}
            
            {renderActionItem(
              'Privacy Settings',
              'Manage your privacy',
              '👁️',
              () => Alert.alert('Privacy', 'Privacy settings coming soon!')
            )}
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            
            {renderActionItem(
              'Help Center',
              'Get help and support',
              '❓',
              () => Alert.alert('Help', 'Help center coming soon!')
            )}
            
            {renderActionItem(
              'Contact Us',
              'Reach out to our team',
              '📞',
              () => Alert.alert('Contact', 'Contact us at support@goldapp.com')
            )}
            
            {renderActionItem(
              'Rate App',
              'Rate us on App Store',
              '⭐',
              () => Alert.alert('Rate App', 'Thank you for your feedback!')
            )}
          </View>

          {/* App Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Information</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Build</Text>
              <Text style={styles.infoValue}>2025.01.15</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>15 Jan 2025</Text>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            
            {renderActionItem(
              'Delete Account',
              'Permanently delete your account',
              '⚠️',
              handleDeleteAccount,
              true
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              GoldApp - Digital Gold Investment Platform
            </Text>
            <Text style={styles.footerText}>
              © 2025 GoldApp. All rights reserved.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffeec2',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
    marginHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff9e3',
    marginHorizontal: 20,
    marginBottom: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8B4513',
    opacity: 0.7,
    marginTop: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff9e3',
    marginHorizontal: 20,
    marginBottom: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '500',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#8B4513',
    opacity: 0.7,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 20,
    color: '#8B4513',
    opacity: 0.6,
  },
  destructiveText: {
    color: '#F44336',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff9e3',
    marginHorizontal: 20,
    marginBottom: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#8B4513',
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 5,
  },
});

export default SettingsScreen;
