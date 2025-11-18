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
import MockRazorpayWebView from '../components/MockRazorpayWebView';

const { width, height } = Dimensions.get('window');

const GoldBuyScreenContent = ({ navigation, route }) => {
  const { userInfo } = route.params || {};
  const [goldRates, setGoldRates] = useState(null);
  const [inputMode, setInputMode] = useState('amount'); // 'amount' or 'quantity'
  const [inputValue, setInputValue] = useState('');
  const [calculatedValue, setCalculatedValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [userBanks, setUserBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showRazorpayWebView, setShowRazorpayWebView] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);

  useEffect(() => {
    loadInitialData();
    
    // Start animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Force load banks after a short delay to test
    setTimeout(() => {
      console.log('🔄 Force loading banks after 2 seconds...');
      loadUserBanks();
    }, 2000);
  }, []);

  // Reload banks when screen comes into focus (after adding banks)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Buy Gold screen focused - reloading banks...');
      console.log('🔄 Current userBanks state:', userBanks.length);
      loadUserBanks();
    });

    return unsubscribe;
  }, [navigation]);

  // Debug: Monitor userBanks state changes
  useEffect(() => {
    console.log('🏦 userBanks state changed:', userBanks.length, 'banks');
    if (userBanks.length > 0) {
      console.log('🏦 Bank details:', userBanks.map(bank => ({ id: bank.id, name: bank.account_name, number: bank.account_number })));
    }
  }, [userBanks]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Load gold rates
      await loadGoldRates();
      
      // Load user banks
      await loadUserBanks();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoldRates = async () => {
    try {
      const response = await ApiService.makeRequest('/gold/rates.php', {
        method: 'GET',
      });
      
      console.log('Gold rates response:', response);
      
      if (response.success && response.data) {
        setGoldRates(response.data);
        console.log('Gold rates loaded successfully:', response.data);
      } else {
        console.log('Invalid gold rates response format');
        // Use fallback data
        setGoldRates({
          current: {
            buy_price: 6100,
            sell_price: 6000,
            source: 'fallback',
            updated_at: new Date().toISOString(),
            block_id: 'MOCK_BLOCK_' + Date.now()
          }
        });
      }
    } catch (error) {
      console.log('Gold rates loading failed:', error.message);
      // Use fallback data on error
      setGoldRates({
        current: {
          buy_price: 6100,
          sell_price: 6000,
          source: 'fallback',
          updated_at: new Date().toISOString(),
          block_id: 'MOCK_BLOCK_' + Date.now()
        }
      });
    }
  };

  const loadUserBanks = async () => {
    const uniqueId = userInfo?.mobile || '8374670704'; // Use mobile number as unique ID
    console.log('🏦 Loading user banks...');
    console.log('🏦 userInfo object:', userInfo);
    console.log('🏦 Using unique ID:', uniqueId);
    console.log('🏦 API Service base URL:', ApiService.baseURL);
    console.log('🏦 Current userBanks state before loading:', userBanks.length);
    
    // Try direct API call first (bypass API service)
    console.log('🏦 Trying direct API call first...');
    try {
      const directUrl = `https://rozgold.in/api/users/banks/list.php?unique_id=${uniqueId}`;
      console.log('🏦 Direct URL:', directUrl);
      
      const directResponse = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log('🏦 Direct response status:', directResponse.status);
      console.log('🏦 Direct response ok:', directResponse.ok);
      
      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('🏦 Direct API response:', directData);
        
        if (directData.success && directData.data && directData.data.bank_accounts && directData.data.bank_accounts.length > 0) {
          console.log('✅ Direct API banks loaded successfully:', directData.data.bank_accounts);
          console.log('✅ Direct API setting userBanks to:', directData.data.bank_accounts.length, 'banks');
          setUserBanks(directData.data.bank_accounts);
          setSelectedBank(directData.data.bank_accounts[0]);
          console.log('✅ Direct API bank loading completed');
          return;
        } else {
          console.log('❌ Direct API returned no banks or invalid data');
          console.log('❌ Direct API response structure:', { success: directData.success, hasData: !!directData.data, hasBanks: !!(directData.data && directData.data.bank_accounts), bankCount: directData.data?.bank_accounts?.length || 0 });
        }
      } else {
        console.log('❌ Direct API response not OK:', directResponse.status);
        const errorText = await directResponse.text();
        console.log('❌ Direct API error response:', errorText);
      }
    } catch (directError) {
      console.log('❌ Direct API call failed:', directError.message);
    }

    // Try API Service as fallback
    console.log('🏦 Trying API Service as fallback...');
    try {
      const response = await ApiService.getUserBanks(uniqueId);
      console.log('Bank API response:', response);
      
      if (response.success && response.data && response.data.bank_accounts && response.data.bank_accounts.length > 0) {
        console.log('✅ User banks loaded successfully:', response.data.bank_accounts);
        console.log('✅ Setting userBanks to:', response.data.bank_accounts.length, 'banks');
        setUserBanks(response.data.bank_accounts);
        setSelectedBank(response.data.bank_accounts[0]); // Select first bank by default
        console.log('✅ Bank loading completed - userBanks should now have', response.data.bank_accounts.length, 'banks');
      } else {
        console.log('❌ No banks found in API response, showing empty state');
        console.log('❌ Response structure:', { success: response.success, hasData: !!response.data, hasBanks: !!(response.data && response.data.bank_accounts), bankCount: response.data?.bank_accounts?.length || 0 });
        setUserBanks([]);
        setSelectedBank(null);
      }
    } catch (error) {
      console.log('User banks loading failed:', error.message);
      console.log('User banks loading error details:', error);
      
      // Try direct API call as fallback
      console.log('API Service failed, trying direct API call...');
      const directUrl = 'https://rozgold.in/api/users/banks/list.php?unique_id=' + uniqueId;
      console.log('Direct URL:', directUrl);
      
      try {
        const directResponse = await fetch(directUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        
        console.log('Direct response status:', directResponse.status);
        console.log('Direct response headers:', directResponse.headers);
        
        if (directResponse.ok) {
          const directData = await directResponse.json();
          console.log('Direct API response:', directData);
          
          if (directData.success && directData.data && directData.data.bank_accounts && directData.data.bank_accounts.length > 0) {
            console.log('✅ Direct API banks loaded successfully:', directData.data.bank_accounts);
            console.log('✅ Direct API setting userBanks to:', directData.data.bank_accounts.length, 'banks');
            setUserBanks(directData.data.bank_accounts);
            setSelectedBank(directData.data.bank_accounts[0]);
            console.log('✅ Direct API bank loading completed');
            return;
          } else {
            console.log('❌ Direct API returned no banks or invalid data');
            console.log('❌ Direct API response structure:', { success: directData.success, hasData: !!directData.data, hasBanks: !!(directData.data && directData.data.bank_accounts), bankCount: directData.data?.bank_accounts?.length || 0 });
          }
        } else {
          console.log('Direct API response not OK:', directResponse.status);
          const errorText = await directResponse.text();
          console.log('Direct API error response:', errorText);
        }
      } catch (directError) {
        console.log('Direct API call failed:', directError.message);
      }
      
      // Show empty state - user needs to add banks
      setUserBanks([]);
      setSelectedBank(null);
      console.log('No banks available - user needs to add bank accounts');
      
      // For testing: Add mock banks if no real banks are available
      console.log('🧪 Adding mock banks for testing...');
      const mockBanks = [
        {
          id: 'mock_1',
          account_number: '1234567890',
          account_name: 'Test User',
          ifsc_code: 'SBIN0001234',
          bank_name: 'State Bank of India',
          status: 'active'
        },
        {
          id: 'mock_2',
          account_number: '9876543210',
          account_name: 'Test User 2',
          ifsc_code: 'HDFC0001234',
          bank_name: 'HDFC Bank',
          status: 'active'
        }
      ];
      
      console.log('🧪 Setting mock banks:', mockBanks);
      setUserBanks(mockBanks);
      setSelectedBank(mockBanks[0]);
      console.log('🧪 Mock banks set successfully');
    }
  };

  const processRazorpayPayment = async (transaction, amount) => {
    try {
      console.log('💳 Processing Razorpay payment for amount:', amount);
      console.log('💳 Transaction ID:', transaction.merchant_transaction_id);
      
      // Store transaction ID for later use
      setCurrentTransactionId(transaction.merchant_transaction_id);
      
      // Create Razorpay order
      const orderResponse = await ApiService.makeRequest('/payments/razorpay/create-order.php', {
        method: 'POST',
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
          merchant_transaction_id: transaction.merchant_transaction_id,
          user_info: userInfo
        }),
      });
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create Razorpay order');
      }
      
      console.log('💳 Razorpay order created:', orderResponse.data);
      
      // Store order details for WebView
      setCurrentOrderId(orderResponse.data.order_id);
      setCurrentAmount(amount);
      
      // Show Razorpay WebView
      setShowRazorpayWebView(true);
      
    } catch (error) {
      console.error('💳 Razorpay payment error:', error);
      Alert.alert(
        'Payment Failed', 
        `Payment processing failed: ${error.message || 'Please try again.'}`
      );
      setIsLoading(false);
    }
  };

  const handleRazorpaySuccess = async (paymentData) => {
    try {
      console.log('💳 Razorpay payment successful:', paymentData);
      console.log('💳 Updating transaction ID:', currentTransactionId);
      
      // Verify payment
      const verifyResponse = await ApiService.makeRequest('/payments/razorpay/verify-payment.php', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: currentOrderId,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
          merchant_transaction_id: currentTransactionId
        }),
      });
      
      if (verifyResponse.success) {
        // Update transaction status to completed
        try {
          const updateResponse = await ApiService.makeRequest('/gold/update-transaction-status.php', {
            method: 'POST',
            body: JSON.stringify({
              merchant_transaction_id: currentTransactionId,
              status: 'completed',
              payment_status: 'completed',
              payment_method: 'razorpay',
              payment_reference: paymentData.razorpay_payment_id
            }),
          });
          console.log('✅ Transaction status updated to completed:', updateResponse);
        } catch (updateError) {
          console.error('⚠️ Failed to update transaction status:', updateError);
        }
        
        // Close WebView
        setShowRazorpayWebView(false);
        
        // Show success message
        Alert.alert(
          'Payment Successful!',
          `Your gold purchase has been completed successfully.\n\n` +
          `Amount: ₹${currentAmount.toFixed(2)}\n` +
          `Payment ID: ${paymentData.razorpay_payment_id}\n\n` +
          `Gold has been added to your portfolio.\n\n` +
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
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }
      
    } catch (error) {
      console.error('💳 Payment verification error:', error);
      Alert.alert('Payment Failed', `Payment verification failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayError = (error) => {
    console.error('💳 Razorpay WebView error:', error);
    setShowRazorpayWebView(false);
    Alert.alert('Payment Failed', `Payment failed: ${error}`);
    setIsLoading(false);
  };

  const handleRazorpayClose = () => {
    setShowRazorpayWebView(false);
    setIsLoading(false);
  };

  const calculateValue = (value) => {
    if (!goldRates || !goldRates.current) return 0;
    
    const numValue = parseFloat(value) || 0;
    const buyPrice = parseFloat(goldRates.current.buy_price) || 0;
    
    if (inputMode === 'amount') {
      // Convert amount (₹) to quantity (grams)
      return numValue / buyPrice;
    } else {
      // Convert quantity (grams) to amount (₹)
      return numValue * buyPrice;
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

  const handleBuyGold = async () => {
    if (!inputValue || parseFloat(inputValue) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid amount or quantity.');
      return;
    }

    if (!selectedBank) {
      Alert.alert('No Bank Selected', 'Please select a bank account for payment.');
      return;
    }

    const quantity = inputMode === 'quantity' ? parseFloat(inputValue) : calculatedValue;
    const amount = inputMode === 'amount' ? parseFloat(inputValue) : calculatedValue;
    
    console.log('handleBuyGold - inputMode:', inputMode);
    console.log('handleBuyGold - inputValue:', inputValue);
    console.log('handleBuyGold - calculatedValue:', calculatedValue);
    console.log('handleBuyGold - quantity:', quantity);
    console.log('handleBuyGold - amount:', amount);

    // Validate that we have valid values
    if (inputMode === 'quantity' && (isNaN(quantity) || quantity <= 0)) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity in grams.');
      return;
    }
    
    if (inputMode === 'amount' && (isNaN(amount) || amount <= 0)) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount in rupees.');
      return;
    }

    // Validate minimum amount for Stripe (₹50 minimum)
    const MINIMUM_AMOUNT = 50;
    if (amount < MINIMUM_AMOUNT) {
      Alert.alert(
        'Minimum Amount Required', 
        `Minimum purchase amount is ₹${MINIMUM_AMOUNT}. Please enter a higher amount.`
      );
      return;
    }

    Alert.alert(
      'Confirm Gold Purchase',
      `Are you sure you want to buy ${quantity.toFixed(4)}g of gold for ₹${amount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => executeBuyOrder(quantity, amount) }
      ]
    );
  };

  const executeBuyOrder = async (quantity, amount) => {
    try {
      setIsLoading(true);
      
      // Generate unique transaction ID
      const merchantTransactionId = 'TXN_' + Date.now();
      const uniqueId = userInfo?.mobile || '8374670704';
      const blockId = goldRates?.current?.block_id || 'MOCK_BLOCK_' + Date.now();
      
      // Create buyData based on input mode - only send quantity OR amount, not both
      const buyData = {
        lockPrice: goldRates.current.buy_price,
        metalType: 'gold',
        merchantTransactionId: merchantTransactionId,
        uniqueId: uniqueId,
        blockId: blockId,
        modeOfPayment: selectedBank?.bank_name || 'Bank Transfer',
        referenceType: '',
        referenceId: '',
        utmSource: 'mobile_app',
        utmMedium: 'gold_buy',
        utmCampaign: 'direct_purchase',
        test_mode: true // Enable test mode for development
      };

      // Add either quantity or amount based on input mode
      if (inputMode === 'quantity') {
        buyData.quantity = quantity;
        // Don't include amount when quantity is provided
      } else {
        buyData.amount = amount;
        // Don't include quantity when amount is provided
      }

      console.log('Buying gold with data:', buyData);
      console.log('Input mode:', inputMode);
      console.log('Quantity:', quantity, 'Amount:', amount);
      
      // First, create the transaction in our system
      const response = await ApiService.makeRequest('/gold/buy.php', {
        method: 'POST',
        body: JSON.stringify(buyData),
      });
      
      console.log('Gold Buy API Response:', response);
      
      // If transaction created successfully, process payment with Stripe
      if (response.success) {
        const transaction = response.data.buy_transaction;
        console.log('Transaction created, processing payment:', transaction);
        
        // Process payment with Stripe
        await processRazorpayPayment(transaction, amount);
        return;
      }
      
      // If API fails due to rate limiting or auth issues, use fallback
      if (!response.success && (
        response.message?.includes('Rate limit') || 
        response.message?.includes('Authentication failed')
      )) {
        console.log('Using fallback purchase simulation due to API limitations');
        
        // Simulate successful purchase for demo purposes
        const fallbackTransaction = {
          merchant_transaction_id: buyData.merchantTransactionId,
          unique_id: buyData.uniqueId,
          metal_type: buyData.metalType,
          quantity: quantity,
          amount: amount,
          lock_price: buyData.lockPrice,
          total_amount: amount,
          status: 'pending',
          payment_status: 'pending',
          block_id: buyData.blockId,
          mode_of_payment: buyData.modeOfPayment,
          created_at: new Date().toISOString(),
          source: 'fallback_demo'
        };
        
        Alert.alert(
          'Purchase Initiated (Demo Mode)',
          `Your gold purchase has been initiated successfully.\n\n` +
          `Quantity: ${quantity.toFixed(4)}g\n` +
          `Amount: ₹${amount.toFixed(2)}\n` +
          `Transaction ID: ${fallbackTransaction.merchant_transaction_id}\n\n` +
          `Note: This is a demo transaction. In production, this would be processed through Augmont API.`,
          [
            { 
              text: 'View Dashboard', 
              onPress: () => navigation.navigate('Dashboard', { userInfo }) 
            }
          ]
        );
        return;
      }
      
      if (response.success) {
        const buyTransaction = response.data.buy_transaction;
        
        Alert.alert(
          'Purchase Initiated!',
          `Your gold purchase has been initiated successfully.\n\n` +
          `Quantity: ${quantity.toFixed(4)}g\n` +
          `Amount: ₹${amount.toFixed(2)}\n` +
          `Transaction ID: ${buyTransaction.merchant_transaction_id}\n\n` +
          `Please complete the payment to finalize your purchase.`,
          [
            { 
              text: 'View Dashboard', 
              onPress: () => navigation.navigate('Dashboard', { userInfo }) 
            }
          ]
        );
      } else {
        // Handle specific error cases
        if (response.message && response.message.includes('Rate limit')) {
          Alert.alert(
            'Service Temporarily Unavailable',
            'Gold purchase service is temporarily unavailable due to high demand. Please try again in a few minutes.',
            [
              { text: 'OK', style: 'default' }
            ]
          );
        } else if (response.message && response.message.includes('Authentication failed')) {
          Alert.alert(
            'Service Error',
            'Unable to connect to gold trading service. Please try again later.',
            [
              { text: 'OK', style: 'default' }
            ]
          );
        } else {
          Alert.alert(
            'Purchase Failed', 
            response.message || 'Failed to initiate the purchase. Please try again.'
          );
        }
      }
      
    } catch (error) {
      console.error('Buy order failed:', error);
      Alert.alert(
        'Purchase Failed', 
        `Network error: ${error.message || 'Please check your internet connection and try again.'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatGrams = (grams) => {
    if (grams === null || grams === undefined) return '0.000 g';
    return `${grams.toFixed(4)} g`;
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
      
      <ScrollView style={styles.scrollView}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                console.log('Back button pressed');
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Dashboard');
                }
              }}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Buy Gold</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Live Gold Rate Card */}
          <View style={styles.rateCard}>
            <View style={styles.rateHeader}>
              <Text style={styles.rateTitle}>Live Gold Rate</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
            <Text style={styles.rateValue}>
              {goldRates && goldRates.current ? formatCurrency(goldRates.current.buy_price) : 'Loading...'}/g
            </Text>
            <Text style={styles.rateSubtext}>24 Karat Gold</Text>
          </View>

          {/* Input Mode Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, inputMode === 'amount' && styles.toggleButtonActive]}
              onPress={() => setInputMode('amount')}
            >
              <Text style={[styles.toggleButtonText, inputMode === 'amount' && styles.toggleButtonTextActive]}>
                Amount (₹)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, inputMode === 'quantity' && styles.toggleButtonActive]}
              onPress={() => setInputMode('quantity')}
            >
              <Text style={[styles.toggleButtonText, inputMode === 'quantity' && styles.toggleButtonTextActive]}>
                Quantity (g)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Enter {inputMode === 'amount' ? 'Amount' : 'Quantity'}
              {inputMode === 'amount' && (
                <Text style={styles.minimumText}> (Minimum ₹50)</Text>
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
                placeholder={`Enter ${inputMode === 'amount' ? 'amount (min ₹50)' : 'quantity'}`}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
              <Text style={styles.inputSuffix}>
                {inputMode === 'amount' ? '' : 'g'}
              </Text>
            </View>
          </View>

          {/* Calculation Display */}
          {inputValue && (
            <View style={styles.calculationCard}>
              <Text style={styles.calculationTitle}>Calculation</Text>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>
                  {inputMode === 'amount' ? 'Quantity:' : 'Amount:'}
                </Text>
                <Text style={styles.calculationValue}>
                  {isCalculating ? 'Calculating...' : 
                    inputMode === 'amount' ? formatGrams(calculatedValue) : formatCurrency(calculatedValue)
                  }
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Rate:</Text>
                <Text style={styles.calculationValue}>
                  {goldRates && goldRates.current ? formatCurrency(goldRates.current.buy_price) : 'Loading...'}/g
                </Text>
              </View>
            </View>
          )}

          {/* Bank Selection */}
          <View style={styles.bankSection}>
            <View style={styles.bankSectionHeader}>
              <View>
                <Text style={styles.bankTitle}>Payment Method</Text>
                <Text style={styles.debugText}>Banks: {userBanks.length} | Selected: {selectedBank ? selectedBank.bank_name : 'None'}</Text>
              </View>
              <View style={styles.bankHeaderButtons}>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={() => {
                    console.log('🔄 Manual refresh button pressed');
                    loadUserBanks();
                  }}
                >
                  <Text style={styles.refreshButtonText}>🔄</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addBankButton}
                  onPress={() => navigation.navigate('BankManagement')}
                >
                  <Text style={styles.addBankButtonText}>+ Add Bank</Text>
                </TouchableOpacity>
              </View>
            </View>
            {userBanks.length > 0 ? (
              userBanks.map((bank) => (
                <TouchableOpacity
                  key={bank.id}
                  style={[styles.bankCard, selectedBank?.id === bank.id && styles.bankCardSelected]}
                  onPress={() => setSelectedBank(bank)}
                >
                  <View style={styles.bankInfo}>
                    <Text style={styles.bankName}>{bank.bank_name || 'Bank'}</Text>
                    <Text style={styles.bankAccount}>{bank.account_number}</Text>
                    <Text style={styles.bankHolder}>{bank.account_name}</Text>
                  </View>
                  <View style={styles.radioButton}>
                    {selectedBank?.id === bank.id && <View style={styles.radioButtonSelected} />}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyBankState}>
                <Text style={styles.emptyBankIcon}>🏦</Text>
                <Text style={styles.emptyBankTitle}>No Bank Accounts</Text>
                <Text style={styles.emptyBankText}>
                  Please add a bank account to purchase gold
                </Text>
                <TouchableOpacity 
                  style={styles.addBankButton}
                  onPress={() => navigation.navigate('BankManagement')}
                >
                  <Text style={styles.addBankButtonText}>Add Bank Account</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Buy Button */}
          <TouchableOpacity
            style={[styles.buyButton, (!inputValue || !selectedBank || userBanks.length === 0) && styles.buyButtonDisabled]}
            onPress={handleBuyGold}
            disabled={!inputValue || !selectedBank || userBanks.length === 0 || isLoading}
          >
            <Text style={styles.buyButtonText}>
              {isLoading ? 'Processing...' : userBanks.length === 0 ? 'Add Bank Account First' : 'Buy Gold'}
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By purchasing gold, you agree to our terms and conditions. 
            Gold prices are subject to market fluctuations.
          </Text>
        </Animated.View>
      </ScrollView>
      
      {/* Razorpay WebView Modal */}
      <MockRazorpayWebView
        visible={showRazorpayWebView}
        onClose={handleRazorpayClose}
        onSuccess={handleRazorpaySuccess}
        onError={handleRazorpayError}
        orderId={currentOrderId}
        amount={currentAmount}
        currency="INR"
        merchantName="GoldApp"
        userName={userInfo?.name || ''}
        userEmail={userInfo?.email || ''}
        userMobile={userInfo?.mobile || ''}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  placeholder: {
    width: 60,
  },
  rateCard: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 15,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '600',
  },
  rateValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  rateSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2c3e50',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
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
    borderColor: '#ddd',
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
    paddingVertical: 15,
    color: '#2c3e50',
  },
  inputSuffix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 5,
  },
  calculationCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    marginBottom: 5,
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
  bankSection: {
    marginBottom: 20,
  },
  bankSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  bankHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 15,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  debugText: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 2,
  },
  addBankButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  addBankButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  bankCardSelected: {
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
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2c3e50',
  },
  emptyBankState: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  emptyBankIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyBankTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyBankText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  buyButton: {
    backgroundColor: '#2c3e50',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});

// Main Component Export
const GoldBuyScreen = ({ navigation, route }) => {
  return <GoldBuyScreenContent navigation={navigation} route={route} />;
};

export default GoldBuyScreen;
