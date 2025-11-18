import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ApiService from '../services/apiService';

const { width, height } = Dimensions.get('window');

const GoldSellScreen = ({ navigation, route }) => {
  const { userInfo } = route.params || {};
  const [goldRates, setGoldRates] = useState({
    current: {
      sell_price: 6100,
      buy_price: 6200,
      block_id: 'MOCK_BLOCK_' + Date.now()
    }
  });
  const [inputMode, setInputMode] = useState('amount'); // 'quantity' or 'amount'
  const [inputValue, setInputValue] = useState('100');
  const [calculatedValue, setCalculatedValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [userBanks, setUserBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [availableGold, setAvailableGold] = useState(0); // Available gold to sell
  const [availableValue, setAvailableValue] = useState(0); // Available value in rupees

  useEffect(() => {
    loadInitialData();
    
    // Start animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadGoldRates(),
        loadUserBanks(),
        loadAvailableGold()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoldRates = async () => {
    try {
      console.log('📊 Loading gold rates...');
      const response = await ApiService.makeRequest('/rates/live.php');
      
      if (response.success && response.data) {
        setGoldRates(response.data);
        console.log('📊 Gold rates loaded:', response.data);
      } else {
        // Fallback rates for testing
        setGoldRates({
          current: {
            sell_price: 6100,
            buy_price: 6200,
            block_id: 'MOCK_BLOCK_' + Date.now()
          }
        });
        console.log('📊 Using fallback gold rates');
      }
    } catch (error) {
      console.error('📊 Error loading gold rates:', error);
      // Fallback rates
      setGoldRates({
        current: {
          sell_price: 6100,
          buy_price: 6200,
          block_id: 'MOCK_BLOCK_' + Date.now()
        }
      });
    }
  };

  const loadUserBanks = async () => {
    try {
      console.log('🏦 Loading user banks...');
      
      // Try direct fetch first
      const response = await fetch('https://rozgold.in/api/users/banks/list.php?test_mode=1&unique_id=8367070701', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🏦 Direct fetch response:', data);
        if (data.success && data.data && data.data.bank_accounts && data.data.bank_accounts.length > 0) {
          setUserBanks(data.data.bank_accounts);
          setSelectedBank(data.data.bank_accounts[0]);
          console.log('🏦 Banks loaded via direct fetch:', data.data.bank_accounts);
          return;
        }
      }
      
      // Fallback to ApiService
      const apiResponse = await ApiService.makeRequest('/users/banks/list.php?test_mode=1&unique_id=8367070701');
      console.log('🏦 ApiService response:', apiResponse);
      if (apiResponse.success && apiResponse.data && apiResponse.data.bank_accounts && apiResponse.data.bank_accounts.length > 0) {
        setUserBanks(apiResponse.data.bank_accounts);
        setSelectedBank(apiResponse.data.bank_accounts[0]);
        console.log('🏦 Banks loaded via ApiService:', apiResponse.data.bank_accounts);
        return;
      }
      
      // No banks found - show empty state
      setUserBanks([]);
      setSelectedBank(null);
      console.log('🏦 No banks found - user needs to add banks');
      
    } catch (error) {
      console.error('🏦 Error loading banks:', error);
      console.error('🏦 Error details:', error.message);
      
      // Error fallback - show empty state
      setUserBanks([]);
      setSelectedBank(null);
      console.log('🏦 Error loading banks - user needs to add banks');
    }
  };

  const loadAvailableGold = async () => {
    try {
      console.log('💰 Loading available gold...');
      const response = await ApiService.makeRequest('/user/dashboard.php');
      
      if (response.success && response.data) {
        const availableGrams = parseFloat(response.data.balance_grams) || 0;
        const availableInr = parseFloat(response.data.balance_inr) || 0;
        
        setAvailableGold(availableGrams);
        setAvailableValue(availableInr);
        
        console.log('💰 Available gold loaded:', {
          grams: availableGrams,
          inr: availableInr
        });
      } else {
        console.log('⚠️ Dashboard API returned unsuccessful response, using fallback');
        setAvailableGold(0.016); // Fallback for testing
        setAvailableValue(98.36);
      }
    } catch (error) {
      console.error('Error loading available gold:', error);
      setAvailableGold(0.016); // Fallback for testing
      setAvailableValue(98.36);
    }
  };

  const calculateValue = (value) => {
    const numValue = parseFloat(value) || 0;
    const sellPrice = goldRates?.rates?.gold?.sell_rate || 6100; // Use fallback price
    
    console.log('calculateValue - value:', value, 'numValue:', numValue, 'sellPrice:', sellPrice, 'inputMode:', inputMode);
    
    if (inputMode === 'quantity') {
      // Convert quantity (grams) to amount (₹)
      const result = numValue * sellPrice;
      console.log('calculateValue - quantity to amount:', numValue, 'x', sellPrice, '=', result);
      return result;
    } else {
      // Convert amount (₹) to quantity (grams)
      const result = numValue / sellPrice;
      console.log('calculateValue - amount to quantity:', numValue, '/', sellPrice, '=', result);
      return result;
    }
  };

  const handleInputChange = (value) => {
    setInputValue(value);
    setIsCalculating(true);
    
    // Debounce calculation
    setTimeout(() => {
      const calculated = calculateValue(value);
      setCalculatedValue(calculated);
      setIsCalculating(false);
    }, 300);
  };

  const handleSellGold = async () => {
    if (!inputValue || parseFloat(inputValue) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid quantity or amount.');
      return;
    }

    if (!selectedBank) {
      Alert.alert('No Bank Selected', 'Please select a bank account for receiving payment.');
      return;
    }

    // Gold rates are always available (with fallback)

    // Calculate the actual values based on current input
    const sellPrice = goldRates?.rates?.gold?.sell_rate || 6100;
    const quantity = inputMode === 'quantity' ? parseFloat(inputValue) : calculateValue(inputValue);
    const amount = inputMode === 'amount' ? parseFloat(inputValue) : calculateValue(inputValue);
    
    console.log('=== handleSellGold Debug ===');
    console.log('inputMode:', inputMode);
    console.log('inputValue:', inputValue);
    console.log('calculatedValue (state):', calculatedValue);
    console.log('goldRates:', goldRates);
    console.log('sellPrice:', sellPrice);
    console.log('quantity (calculated):', quantity);
    console.log('amount (calculated):', amount);
    console.log('quantity type:', typeof quantity, 'isNaN:', isNaN(quantity));
    console.log('amount type:', typeof amount, 'isNaN:', isNaN(amount));
    console.log('========================');

    // Validate that we have valid values
    if (inputMode === 'quantity' && (isNaN(quantity) || quantity <= 0)) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity in grams.');
      return;
    }
    
    if (inputMode === 'amount' && (isNaN(amount) || amount <= 0)) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount in rupees.');
      return;
    }

    // Validate minimum amount for selling (₹100 minimum)
    const MINIMUM_AMOUNT = 100;
    if (amount < MINIMUM_AMOUNT) {
      Alert.alert(
        'Minimum Amount Required', 
        `Minimum sell amount is ₹${MINIMUM_AMOUNT}. Please enter a higher amount.`
      );
      return;
    }

    // Validate that user has enough gold to sell
    if (quantity > availableGold) {
      Alert.alert(
        'Insufficient Gold',
        `You only have ${availableGold.toFixed(4)}g of gold available to sell.\n\n` +
        `You're trying to sell ${quantity.toFixed(4)}g.\n\n` +
        `Please enter a smaller amount.`
      );
      return;
    }

    Alert.alert(
      'Confirm Gold Sale',
      `Are you sure you want to sell ${quantity.toFixed(4)}g of gold for ₹${amount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => executeSellOrder(quantity, amount) }
      ]
    );
  };

  const executeSellOrder = async (quantity, amount) => {
    try {
      setIsLoading(true);
      
      // Generate unique transaction ID
      const merchantTransactionId = 'SELL_' + Date.now();
      const uniqueId = userInfo?.mobile || '8374670704';
      const blockId = goldRates?.rates?.gold?.block_id || 'MOCK_BLOCK_' + Date.now();
      
      // Create sellData based on input mode - only send quantity OR amount, not both
      const sellData = {
        lockPrice: goldRates?.rates?.gold?.sell_rate || 6100,
        metalType: 'gold',
        merchantTransactionId: merchantTransactionId,
        uniqueId: uniqueId,
        blockId: blockId,
        userBankId: selectedBank?.id,
        accountName: selectedBank?.account_holder_name || selectedBank?.account_name,
        accountNumber: selectedBank?.account_number,
        ifscCode: selectedBank?.ifsc_code,
        test_mode: true // Enable test mode for development
      };

      // Add either quantity or amount based on input mode
      if (inputMode === 'quantity') {
        sellData.quantity = quantity;
        // Don't include amount when quantity is provided
      } else {
        sellData.amount = amount;
        // Don't include quantity when amount is provided
      }

      console.log('Selling gold with data:', sellData);
      console.log('Input mode:', inputMode);
      console.log('Quantity:', quantity, 'Amount:', amount);
      
      // Create the sell transaction
      const response = await ApiService.makeRequest('/gold/sell.php', {
        method: 'POST',
        body: JSON.stringify(sellData),
      });
      
      if (response.success) {
        const transaction = response.data.sell_transaction;
        console.log('Sell transaction created:', transaction);
        
        // Refresh available gold after successful sell
        await loadAvailableGold();
        
        Alert.alert(
          'Sell Order Placed!',
          `Your gold sell order has been placed successfully.\n\n` +
          `Quantity: ${transaction.quantity}g\n` +
          `Amount: ₹${amount.toFixed(2)}\n` +
          `Transaction ID: ${transaction.merchant_transaction_id}\n\n` +
          `Payment will be processed to your bank account.\n\n` +
          `Redirecting to transaction history...`,
          [
            { 
              text: 'View History Now', 
              onPress: () => navigation.navigate('TransactionHistory', { userInfo }) 
            },
            { 
              text: 'View Dashboard', 
              onPress: () => navigation.navigate('Dashboard', { userInfo }) 
            }
          ]
        );
        
        // Auto-redirect to transaction history after 3 seconds
        setTimeout(() => {
          navigation.navigate('TransactionHistory', { userInfo });
        }, 3000);
      } else {
        throw new Error(response.message || 'Failed to create sell order');
      }
      
    } catch (error) {
      console.error('Sell gold error:', error);
      Alert.alert('Sell Failed', `Failed to place sell order: ${error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell Gold</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          
          {/* Live Gold Rate */}
          <View style={styles.rateCard}>
            <View style={styles.rateHeader}>
              <Text style={styles.rateTitle}>Live Gold Rate</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
            <Text style={styles.rateValue}>
              ₹{goldRates?.current?.sell_price?.toLocaleString() || '6,100'}/g
            </Text>
            <Text style={styles.rateSubtitle}>24 Karat Gold</Text>
          </View>

          {/* Available Gold */}
          <View style={styles.availableGoldCard}>
            <View style={styles.availableGoldHeader}>
              <Text style={styles.availableGoldTitle}>Available Gold to Sell</Text>
              <Text style={styles.availableGoldIcon}>💰</Text>
            </View>
            <View style={styles.availableGoldContent}>
              <View style={styles.availableGoldItem}>
                <Text style={styles.availableGoldLabel}>Gold Amount</Text>
                <Text style={styles.availableGoldValue}>{availableGold.toFixed(4)}g</Text>
              </View>
              <View style={styles.availableGoldItem}>
                <Text style={styles.availableGoldLabel}>Current Value</Text>
                <Text style={styles.availableGoldValue}>₹{availableValue.toFixed(2)}</Text>
              </View>
            </View>
            {availableGold === 0 && (
              <Text style={styles.noGoldText}>
                You don't have any gold to sell. Buy some gold first!
              </Text>
            )}
          </View>

          {/* Input Mode Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, inputMode === 'quantity' && styles.activeTab]}
              onPress={() => setInputMode('quantity')}
            >
              <Text style={[styles.tabText, inputMode === 'quantity' && styles.activeTabText]}>
                Quantity (g)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, inputMode === 'amount' && styles.activeTab]}
              onPress={() => setInputMode('amount')}
            >
              <Text style={[styles.tabText, inputMode === 'amount' && styles.activeTabText]}>
                Amount (₹)
                {inputMode === 'amount' && (
                  <Text style={styles.minimumText}> (Minimum ₹100)</Text>
                )}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Enter {inputMode === 'amount' ? 'Amount' : 'Quantity'}
              {inputMode === 'amount' && (
                <Text style={styles.minimumText}> (Minimum ₹100)</Text>
              )}
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>
                {inputMode === 'amount' ? '₹' : ''}
              </Text>
              <TextInput
                style={styles.textInput}
                value={inputValue}
                onChangeText={handleInputChange}
                placeholder={`Enter ${inputMode === 'amount' ? 'amount (min ₹100)' : 'quantity'}`}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
              <Text style={styles.inputSuffix}>
                {inputMode === 'amount' ? '' : 'g'}
              </Text>
            </View>
          </View>

          {/* Calculation Display */}
          <View style={styles.calculationCard}>
            <Text style={styles.calculationTitle}>Calculation</Text>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Quantity:</Text>
              <Text style={styles.calculationValue}>
                {isCalculating ? '...' : (inputMode === 'quantity' ? parseFloat(inputValue) || 0 : calculatedValue || 0).toFixed(4)}g
              </Text>
            </View>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Rate:</Text>
              <Text style={styles.calculationValue}>
                ₹{goldRates?.current?.sell_price?.toLocaleString() || '6,100'}/g
              </Text>
            </View>
            <View style={[styles.calculationRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>
                ₹{isCalculating ? '...' : (() => {
                  const quantity = inputMode === 'quantity' ? parseFloat(inputValue) || 0 : calculatedValue || 0;
                  const amount = inputMode === 'amount' ? parseFloat(inputValue) || 0 : calculatedValue || 0;
                  const sellPrice = goldRates?.current?.sell_price || 6100;
                  const calculatedAmount = inputMode === 'quantity' ? quantity * sellPrice : amount;
                  return calculatedAmount.toFixed(2);
                })()}
              </Text>
            </View>
          </View>

          {/* Payment Method Section */}
          <View style={styles.paymentSection}>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentTitle}>Payment Method</Text>
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>Banks: {userBanks.length} | Selected: {selectedBank?.bank_name || 'None'}</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={loadUserBanks}>
                  <Text style={styles.refreshButtonText}>🔄</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.addBankButton}
              onPress={() => navigation.navigate('BankManagement', { userInfo })}
            >
              <Text style={styles.addBankButtonText}>+ Add Bank</Text>
            </TouchableOpacity>

            {userBanks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No Bank Accounts</Text>
                <Text style={styles.emptyStateSubtext}>Add a bank account to receive payments</Text>
              </View>
            ) : (
              userBanks.map((bank, index) => (
                <TouchableOpacity
                  key={bank.id || index}
                  style={[
                    styles.bankCard,
                    selectedBank?.id === bank.id && styles.selectedBankCard
                  ]}
                  onPress={() => setSelectedBank(bank)}
                >
                  <View style={styles.bankInfo}>
                    <Text style={styles.bankName}>{bank.bank_name}</Text>
                    <Text style={styles.bankAccount}>{bank.account_number}</Text>
                    <Text style={styles.bankHolder}>{bank.account_holder_name || bank.account_name}</Text>
                  </View>
                  <View style={styles.radioButton}>
                    {selectedBank?.id === bank.id && <View style={styles.radioButtonSelected} />}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Sell Button */}
          <TouchableOpacity
            style={[styles.sellButton, (!inputValue || !selectedBank || userBanks.length === 0) && styles.sellButtonDisabled]}
            onPress={handleSellGold}
            disabled={!inputValue || !selectedBank || userBanks.length === 0 || isLoading}
          >
            <Text style={styles.sellButtonText}>
              {isLoading ? 'Processing...' : userBanks.length === 0 ? 'Add Bank Account First' : 'Sell Gold'}
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By selling gold, you agree to our terms and conditions. 
            Gold prices are subject to market fluctuations. Payment will be processed to your selected bank account.
          </Text>
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
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  headerSpacer: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  rateCard: {
    backgroundColor: '#2c3e50',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
    marginRight: 5,
  },
  liveText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
  },
  rateValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  rateSubtitle: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  availableGoldCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  availableGoldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  availableGoldTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  availableGoldIcon: {
    fontSize: 20,
  },
  availableGoldContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  availableGoldItem: {
    flex: 1,
    alignItems: 'center',
  },
  availableGoldLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  availableGoldValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#27ae60',
  },
  noGoldText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2c3e50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  minimumText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  minimumText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    paddingHorizontal: 15,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 5,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    paddingVertical: 15,
  },
  inputSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 5,
  },
  calculationCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#666',
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27ae60',
  },
  paymentSection: {
    marginBottom: 20,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  debugInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  refreshButton: {
    padding: 5,
  },
  refreshButtonText: {
    fontSize: 16,
  },
  addBankButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  addBankButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  bankCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedBankCard: {
    borderColor: '#2c3e50',
    borderWidth: 2,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  bankAccount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  bankHolder: {
    fontSize: 12,
    color: '#999',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2c3e50',
  },
  sellButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  sellButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  sellButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default GoldSellScreen;
