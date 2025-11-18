import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/apiService';

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation, route }) => {
  const { userInfo } = route.params || {};
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [goldRates, setGoldRates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadDashboardData();
    
    // Start animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Set up interval to refresh gold rates every 30 seconds
    const interval = setInterval(() => {
      loadGoldRates();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Refresh dashboard when screen comes into focus (e.g., after buying gold)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Dashboard screen focused - refreshing data');
      loadDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadGoldRates = async () => {
    try {
      const directUrl = 'https://rozgold.in/api/gold/rates.php';
      
      try {
        const directResponse = await fetch(directUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        
        const directData = await directResponse.json();
        
        if (directData.success && directData.data) {
          setGoldRates(directData.data);
          setLastUpdated(new Date().toLocaleTimeString());
          return;
        }
      } catch (directError) {
        // Fallback to ApiService
        const ratesResponse = await ApiService.makeRequest('/gold/rates.php');
        
        if (ratesResponse.success && ratesResponse.data) {
          setGoldRates(ratesResponse.data);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      }
    } catch (ratesError) {
      console.log('Gold rates refresh error:', ratesError.message);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Always try to get gold rates first (this works without auth)
      try {
        const directUrl = 'https://rozgold.in/api/gold/rates.php';
        
        try {
          const directResponse = await fetch(directUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });
          
          const directData = await directResponse.json();
          
          if (directData.success && directData.data) {
            setGoldRates(directData.data);
            setLastUpdated(new Date().toLocaleTimeString());
          } else {
            throw new Error('Direct fetch returned unsuccessful response');
          }
        } catch (directError) {
          // Fallback to ApiService
          const ratesResponse = await ApiService.makeRequest('/gold/rates.php');
          
          if (ratesResponse.success && ratesResponse.data) {
            setGoldRates(ratesResponse.data);
            setLastUpdated(new Date().toLocaleTimeString());
          } else {
            // Set empty data if API fails
            setGoldRates({
              current: {
                buy_price: 0,
                sell_price: 0
              }
            });
          }
        }
      } catch (ratesError) {
        setGoldRates({
          current: {
            buy_price: 0,
            sell_price: 0
          }
        });
      }
      
      // Load real dashboard data from API
      try {
        const dashboardResponse = await ApiService.makeRequest('/user/dashboard.php');
        if (dashboardResponse.success) {
          // Map API response to expected format
          const mappedData = {
            total_gold: parseFloat(dashboardResponse.data.balance_grams) || 0,
            total_value: parseFloat(dashboardResponse.data.balance_inr) || 0,
            total_invested: parseFloat(dashboardResponse.data.balance_inr) || 0,
            profit_loss: 0, // Calculate if needed
            profit_percentage: 0, // Calculate if needed
            buy_price: parseFloat(dashboardResponse.data.buy_price) || 0,
            sell_price: parseFloat(dashboardResponse.data.sell_price) || 0,
            transactions: dashboardResponse.data.transactions || [],
            stats: dashboardResponse.data.stats || {}
          };
          setUserData(mappedData);
          console.log('Dashboard data loaded successfully:', mappedData);
        } else {
          console.log('Dashboard API returned unsuccessful response:', dashboardResponse);
          // Set empty data if API fails
          setUserData({
            total_gold: 0,
            total_value: 0,
            total_invested: 0,
            profit_loss: 0,
            profit_percentage: 0
          });
        }
      } catch (dashboardError) {
        console.log('Dashboard API failed:', dashboardError.message);
        // Set empty data if API fails
        setUserData({
          total_gold: 0,
          total_value: 0,
          total_invested: 0,
          profit_loss: 0,
          profit_percentage: 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty data on error
      setUserData({
        total_gold: 0,
        total_value: 0,
        total_invested: 0,
        profit_loss: 0,
        profit_percentage: 0
      });
      
      setGoldRates({
        current: {
          buy_price: 0,
          sell_price: 0
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData().finally(() => setRefreshing(false));
  };

  const handleLogout = async () => {
    try {
      await ApiService.clearAuthToken();
      navigation.replace('MobileLogin');
    } catch (error) {
      console.error('Logout error:', error);
      navigation.replace('MobileLogin');
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatGrams = (grams) => {
    if (grams === null || grams === undefined) return '0.000 g';
    return `${grams.toFixed(4)} g`;
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '₹0.00';
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getUserInitials = () => {
    // Use auth context user first, then fallback to route params
    const currentUser = user || userInfo;
    if (currentUser && currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();
    }
    return 'GU';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            {/* User Initials */}
            <View style={styles.userInitials}>
              <Text style={styles.userInitialsText}>{getUserInitials()}</Text>
            </View>
            
            {/* Gold Price Card */}
            <View style={styles.goldPriceCard}>
              <Text style={styles.goldPriceLabel}>Gold Price</Text>
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>Live</Text>
                <View style={styles.liveDot} />
              </View>
              <Text style={styles.goldPriceValue}>
                {goldRates && goldRates.current && goldRates.current.buy_price > 0 
                  ? formatPrice(goldRates.current.buy_price) 
                  : 'Loading...'}/g
              </Text>
              {lastUpdated && (
                <Text style={styles.lastUpdatedText}>
                  Updated: {lastUpdated}
                </Text>
              )}
            </View>
            
            {/* Action Buttons */}
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.refreshButton} onPress={loadGoldRates}>
                <Text style={styles.refreshButtonText}>🔄</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={() => {
                  Alert.alert(
                    'Logout',
                    'Are you sure you want to logout?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Logout', onPress: logout }
                    ]
                  );
                }}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Gold Coin Progress Banner */}
          <View style={styles.progressBanner}>
            <Text style={styles.progressText}>First 0.1 g Gold Coin</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.coinIcon}>🪙</Text>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill, 
                  { 
                    width: userData && userData.total_gold > 0 
                      ? `${Math.min(100, (userData.total_gold / 0.1) * 100)}%` 
                      : '0%' 
                  }
                ]} />
              </View>
              <Text style={styles.progressArrow}>→</Text>
            </View>
          </View>

          {/* Main Gold Savings Card */}
          <View style={styles.savingsCard}>
            <View style={styles.savingsHeader}>
              <Text style={styles.savingsTitle}>Savings in Gold</Text>
              <TouchableOpacity>
                <Text style={styles.seeDetailsText}>See Details {'>'}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.savingsContent}>
              <View style={styles.savingsInfo}>
                <Text style={styles.savingsValue}>
                  {userData && userData.total_value ? formatCurrency(userData.total_value) : '₹0'}
                </Text>
                <Text style={styles.savingsGrams}>
                  {userData && userData.total_gold ? formatGrams(userData.total_gold) : '0.000 g'} of Gold
                </Text>
              </View>
              
              <View style={styles.goldBarsContainer}>
                <View style={styles.goldBars}>
                  {userData && userData.total_gold > 0 ? (
                    [...Array(Math.min(7, Math.max(1, Math.ceil(userData.total_gold * 100))))].map((_, index) => (
                      <View key={index} style={[styles.goldBar, { height: 20 + (index * 3) }]} />
                    ))
                  ) : (
                    <Text style={styles.noGoldText}>No Gold Yet</Text>
                  )}
                </View>
                <View style={styles.goldBarsPedestal} />
                <Text style={styles.goldBarsLabel}>24 Karat Gold</Text>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.withdrawButton}>
                <Text style={styles.withdrawButtonText}>Withdraw</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={() => navigation.navigate('GoldBuy', { userInfo })}
              >
                <Text style={styles.saveButtonIcon}>⚡</Text>
                <Text style={styles.saveButtonText}>Save Instantly</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions Menu */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => navigation.navigate('TransactionHistory')}
              >
                <Text style={styles.quickActionIcon}>📋</Text>
                <Text style={styles.quickActionText}>Transactions</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => navigation.navigate('UserProfile')}
              >
                <Text style={styles.quickActionIcon}>👤</Text>
                <Text style={styles.quickActionText}>Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => navigation.navigate('BankManagement')}
              >
                <Text style={styles.quickActionIcon}>🏦</Text>
                <Text style={styles.quickActionText}>Banks</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => navigation.navigate('Settings')}
              >
                <Text style={styles.quickActionIcon}>⚙️</Text>
                <Text style={styles.quickActionText}>Settings</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => navigation.navigate('GoldBuy')}
              >
                <Text style={styles.quickActionIcon}>💰</Text>
                <Text style={styles.quickActionText}>Buy Gold</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => navigation.navigate('GoldSell')}
              >
                <Text style={styles.quickActionIcon}>💸</Text>
                <Text style={styles.quickActionText}>Sell Gold</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Badge */}
          <View style={styles.securityBadge}>
            <Text style={styles.securityIcon}>🛡️</Text>
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
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 10,
  },
  userInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitialsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goldPriceCard: {
    backgroundColor: '#2c3e50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 120,
  },
  goldPriceLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveText: {
    color: '#e74c3c',
    fontSize: 10,
    marginRight: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e74c3c',
  },
  goldPriceValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  lastUpdatedText: {
    color: '#fff',
    fontSize: 8,
    opacity: 0.7,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    borderRadius: 20,
  },
  refreshButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 15,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBanner: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#34495e',
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 4,
  },
  progressArrow: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  savingsCard: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f39c12',
    marginBottom: 20,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  savingsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeDetailsText: {
    color: '#fff',
    fontSize: 14,
  },
  savingsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  savingsInfo: {
    flex: 1,
  },
  savingsValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  savingsGrams: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
  },
  goldBarsContainer: {
    alignItems: 'center',
  },
  goldBars: {
    flexDirection: 'row',
    alignItems: 'end',
    marginBottom: 5,
  },
  goldBar: {
    width: 8,
    backgroundColor: '#f39c12',
    marginHorizontal: 1,
    borderRadius: 2,
  },
  goldBarsPedestal: {
    width: 60,
    height: 10,
    backgroundColor: '#2c3e50',
    borderRadius: 5,
  },
  goldBarsLabel: {
    color: '#fff',
    fontSize: 10,
    marginTop: 5,
  },
  noGoldText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  saveButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  quickActionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    backgroundColor: '#34495e',
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f39c12',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  securityBadge: {
    alignItems: 'center',
    marginTop: 10,
  },
  securityIcon: {
    fontSize: 24,
  },
});

export default DashboardScreen;