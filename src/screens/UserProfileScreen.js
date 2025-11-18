import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/apiService';

const UserProfileScreen = ({ navigation, route }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [usingRealData, setUsingRealData] = useState(false);

  useEffect(() => {
    loadProfileData();
    
    // Start animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [isAuthenticated]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading profile data...');
      console.log('🔐 User authenticated:', isAuthenticated);
      console.log('👤 User data:', user);
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        console.log('⚠️ User not authenticated, using fallback data');
        setUsingRealData(false);
        setProfileData({
          name: 'User_8367070701',
          email: '8367070701@goldapp.local',
          mobile: '8367070701',
          kyc_status: 'pending',
          pan: null,
          aadhaar: null
        });
        return;
      }
      
      // If user is authenticated, use the data from AuthContext first
      if (user && user.name) {
        console.log('✅ Using data from AuthContext:', user);
        setProfileData({
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          kyc_status: user.kyc_status,
          pan: user.pan,
          aadhaar: user.aadhaar
        });
        setUsingRealData(true);
        console.log('✅ Profile data loaded from AuthContext - REAL DATA SET');
      } else {
        console.log('⚠️ No user data in AuthContext, making API call...');
        
        // Load user profile from API
        console.log('🔄 About to call getUserProfile...');
        const profileResponse = await ApiService.getUserProfile();
        console.log('📱 Profile Response Type:', typeof profileResponse);
        console.log('📱 Profile Response:', JSON.stringify(profileResponse, null, 2));
        
        // Check if response exists and has the expected structure
        if (profileResponse && typeof profileResponse === 'object' && profileResponse.success === true && profileResponse.data) {
          console.log('✅ API Success - Setting real data:', profileResponse.data);
          setProfileData(profileResponse.data);
          setUsingRealData(true);
          console.log('✅ Profile data loaded successfully - REAL DATA SET');
        } else {
          console.log('⚠️ Profile API failed or no data, using fallback data');
          console.log('⚠️ Response exists:', !!profileResponse);
          console.log('⚠️ Response success:', profileResponse?.success);
          console.log('⚠️ Response data exists:', !!profileResponse?.data);
          console.log('⚠️ Response data:', profileResponse?.data);
          setUsingRealData(false);
          // Set fallback data
          setProfileData({
            name: 'User_8367070701',
            email: '8367070701@goldapp.local',
            mobile: '8367070701',
            kyc_status: 'pending',
            pan: null,
            aadhaar: null
          });
        }
      }

      // Load KYC data (optional - may not exist)
      try {
        const kycResponse = await ApiService.getKYCDetails(user?.mobileNumber || '8367070701');
        if (kycResponse.success && kycResponse.data) {
          setKycData(kycResponse.data.kyc_details);
          console.log('✅ KYC data loaded successfully');
        } else {
          console.log('ℹ️ No KYC data available');
        }
      } catch (kycError) {
        console.log('ℹ️ KYC data not available:', kycError.message);
      }
    } catch (error) {
      console.error('❌ Error loading profile data:', error);
      console.error('❌ Error details:', error.message);
      setUsingRealData(false);
      // Set fallback data
      setProfileData({
        name: 'User_8367070701',
        email: '8367070701@goldapp.local',
        mobile: '8367070701',
        kyc_status: 'pending',
        pan: null,
        aadhaar: null
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData().finally(() => setRefreshing(false));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('MobileLogin');
          }
        }
      ]
    );
  };

  const getKYCStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getKYCStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending';
      default: return 'Not Submitted';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const maskPAN = (pan) => {
    if (!pan) return 'N/A';
    return pan.substring(0, 2) + '****' + pan.substring(6);
  };

  const maskMobile = (mobile) => {
    if (!mobile) return 'N/A';
    return mobile.substring(0, 2) + '****' + mobile.substring(6);
  };

  const maskEmail = (email) => {
    if (!email) return 'N/A';
    const [username, domain] = email.split('@');
    const maskedUsername = username.substring(0, 2) + '****' + username.substring(username.length - 2);
    return `${maskedUsername}@${domain}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>
                {profileData?.name?.charAt(0) || 'U'}
              </Text>
            </View>
            <Text style={styles.userName}>{profileData?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{profileData?.email || 'user@example.com'}</Text>
            <Text style={styles.userMobile}>+91 {profileData?.mobile || '9876543210'}</Text>
            
            {/* Data Source Indicator */}
            {usingRealData ? (
              <View style={[styles.dataSourceIndicator, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.dataSourceText}>✅ Live Data</Text>
              </View>
            ) : (
              <View style={[styles.dataSourceIndicator, { backgroundColor: '#FF9800' }]}>
                <Text style={styles.dataSourceText}>📱 Demo Data</Text>
              </View>
            )}
            
            {/* Edit Profile Button */}
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => Alert.alert('Edit Profile', 'Profile editing feature coming soon!')}
            >
              <Text style={styles.editProfileText}>✏️ Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* KYC Status Card */}
          <View style={styles.kycCard}>
            <View style={styles.kycHeader}>
              <Text style={styles.kycTitle}>KYC Status</Text>
              <View style={[
                styles.kycStatusBadge, 
                { backgroundColor: getKYCStatusColor(kycData?.status || profileData?.kyc_status) }
              ]}>
                <Text style={styles.kycStatusText}>
                  {getKYCStatusText(kycData?.status || profileData?.kyc_status)}
                </Text>
              </View>
            </View>
            
            {kycData && (
              <View style={styles.kycDetails}>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>PAN Number:</Text>
                  <Text style={styles.kycValue}>{maskPAN(kycData.pan_number)}</Text>
                </View>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>Name as per PAN:</Text>
                  <Text style={styles.kycValue}>{kycData.name_as_per_pan || 'N/A'}</Text>
                </View>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>Date of Birth:</Text>
                  <Text style={styles.kycValue}>{formatDate(kycData.date_of_birth)}</Text>
                </View>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>Submitted:</Text>
                  <Text style={styles.kycValue}>{formatDate(kycData.submitted_at)}</Text>
                </View>
                {kycData.verified_at && (
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>Verified:</Text>
                    <Text style={styles.kycValue}>{formatDate(kycData.verified_at)}</Text>
                  </View>
                )}
                {kycData.rejection_reason && (
                  <View style={styles.kycRow}>
                    <Text style={styles.kycLabel}>Rejection Reason:</Text>
                    <Text style={[styles.kycValue, styles.rejectionReason]}>
                      {kycData.rejection_reason}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Menu Options */}
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('TransactionHistory')}
            >
              <Text style={styles.menuIcon}>📋</Text>
              <Text style={styles.menuText}>Transaction History</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('BankManagement')}
            >
              <Text style={styles.menuIcon}>🏦</Text>
              <Text style={styles.menuText}>Bank Accounts</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={styles.menuText}>Settings</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => Alert.alert('Help', 'Help & Support coming soon!')}
            >
              <Text style={styles.menuIcon}>❓</Text>
              <Text style={styles.menuText}>Help & Support</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => Alert.alert('About', 'GoldApp v1.0.0\nDigital Gold Investment Platform')}
            >
              <Text style={styles.menuIcon}>ℹ️</Text>
              <Text style={styles.menuText}>About</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffeec2',
  },
  loadingText: {
    fontSize: 18,
    color: '#2c3e50',
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff9e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },
  profileCard: {
    backgroundColor: '#fff9e3',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatar: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#8B4513',
    marginBottom: 5,
    opacity: 0.8,
  },
  userMobile: {
    fontSize: 16,
    color: '#8B4513',
    opacity: 0.8,
  },
  dataSourceIndicator: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  dataSourceText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  editProfileButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#8B4513',
    borderRadius: 20,
    alignSelf: 'center',
  },
  editProfileText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  kycCard: {
    backgroundColor: '#fff9e3',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  kycHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  kycTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  kycStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  kycStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  kycDetails: {
    gap: 8,
  },
  kycRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kycLabel: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
    flex: 1,
  },
  kycValue: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  rejectionReason: {
    color: '#F44336',
    fontStyle: 'italic',
  },
  menuContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e3',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0d0b0',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: '#8B4513',
    opacity: 0.6,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UserProfileScreen;
