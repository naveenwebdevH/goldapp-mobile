import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const MockRazorpayWebView = ({ 
  visible, 
  onClose, 
  onSuccess, 
  onError, 
  orderId, 
  amount, 
  currency = 'INR',
  merchantName = 'GoldApp',
  userName = '',
  userEmail = '',
  userMobile = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', color: '#2c3e50' },
    { id: 'upi', name: 'UPI', icon: '📱', color: '#9b59b6' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦', color: '#3498db' },
    { id: 'wallet', name: 'Wallets', icon: '💰', color: '#f39c12' },
    { id: 'emi', name: 'EMI', icon: '📅', color: '#e74c3c' },
  ];

  const banks = [
    { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC0000001' },
    { id: 'icici', name: 'ICICI Bank', code: 'ICIC0000002' },
    { id: 'sbi', name: 'State Bank of India', code: 'SBIN0000003' },
    { id: 'axis', name: 'Axis Bank', code: 'UTIB0000004' },
    { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KKBK0000005' },
  ];

  const upiApps = [
    { id: 'phonepe', name: 'PhonePe', icon: '📱' },
    { id: 'gpay', name: 'Google Pay', icon: 'G' },
    { id: 'paytm', name: 'Paytm', icon: 'P' },
    { id: 'bhim', name: 'BHIM', icon: 'B' },
  ];

  const wallets = [
    { id: 'paytm_wallet', name: 'Paytm Wallet', icon: '💰' },
    { id: 'phonepe_wallet', name: 'PhonePe Wallet', icon: '📱' },
    { id: 'mobikwik', name: 'Mobikwik', icon: 'M' },
    { id: 'freecharge', name: 'Freecharge', icon: 'F' },
  ];

  useEffect(() => {
    if (visible) {
      // Auto-open payment methods after a short delay
      setTimeout(() => {
        setShowPaymentForm(true);
      }, 1000);
    }
  }, [visible]);

  const handlePaymentMethodSelect = (method) => {
    setSelectedMethod(method);
    setLoading(true);
    setLoadingStage('Initiating payment...');
    
    // Simulate realistic payment processing with multiple stages
    setTimeout(() => {
      // Stage 1: Payment initiated
      setLoadingStage('Connecting to payment gateway...');
      console.log('💳 Payment initiated with', method.name);
    }, 500);
    
    setTimeout(() => {
      // Stage 2: Payment processing
      setLoadingStage('Processing payment...');
      console.log('💳 Payment processing...');
    }, 1500);
    
    setTimeout(() => {
      // Stage 3: Payment verification
      setLoadingStage('Verifying payment...');
      console.log('💳 Verifying payment...');
    }, 2500);
    
    setTimeout(() => {
      // Stage 4: Payment completed
      setLoading(false);
      setLoadingStage('');
      
      // Simulate successful payment with realistic data
      const mockPaymentData = {
        razorpay_payment_id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        razorpay_order_id: orderId,
        razorpay_signature: 'mock_signature_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      };
      
      console.log('✅ Payment completed successfully:', mockPaymentData);
      onSuccess(mockPaymentData);
    }, 3500); // Increased to 3.5 seconds for more realistic feel
  };

  const handlePaymentCancel = () => {
    onError('Payment cancelled by user');
  };

  const renderPaymentMethods = () => (
    <View style={styles.paymentMethodsContainer}>
      <Text style={styles.sectionTitle}>Choose Payment Method</Text>
      {paymentMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[styles.paymentMethod, { borderLeftColor: method.color }]}
          onPress={() => handlePaymentMethodSelect(method)}
        >
          <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
          <Text style={styles.paymentMethodName}>{method.name}</Text>
          <Text style={styles.paymentMethodArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCardPayment = () => (
    <View style={styles.paymentFormContainer}>
      <Text style={styles.sectionTitle}>Card Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Card Number</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>1234 5678 9012 3456</Text>
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.inputLabel}>Expiry</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>12/25</Text>
          </View>
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
          <Text style={styles.inputLabel}>CVV</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputText}>123</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Cardholder Name</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>{userName || 'John Doe'}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.payButton}
        onPress={() => handlePaymentMethodSelect({ id: 'card', name: 'Credit Card' })}
      >
        <Text style={styles.payButtonText}>Pay ₹{amount.toFixed(2)}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUPIPayment = () => (
    <View style={styles.paymentFormContainer}>
      <Text style={styles.sectionTitle}>Choose UPI App</Text>
      
      {upiApps.map((app) => (
        <TouchableOpacity
          key={app.id}
          style={styles.upiApp}
          onPress={() => handlePaymentMethodSelect({ id: 'upi', name: app.name })}
        >
          <Text style={styles.upiAppIcon}>{app.icon}</Text>
          <Text style={styles.upiAppName}>{app.name}</Text>
          <Text style={styles.upiAppArrow}>›</Text>
        </TouchableOpacity>
      ))}
      
      <View style={styles.divider}>
        <Text style={styles.dividerText}>OR</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Enter UPI ID</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>{userMobile}@paytm</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.payButton}
        onPress={() => handlePaymentMethodSelect({ id: 'upi', name: 'UPI' })}
      >
        <Text style={styles.payButtonText}>Pay ₹{amount.toFixed(2)}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNetBanking = () => (
    <View style={styles.paymentFormContainer}>
      <Text style={styles.sectionTitle}>Select Bank</Text>
      
      {banks.map((bank) => (
        <TouchableOpacity
          key={bank.id}
          style={styles.bankOption}
          onPress={() => handlePaymentMethodSelect({ id: 'netbanking', name: bank.name })}
        >
          <Text style={styles.bankName}>{bank.name}</Text>
          <Text style={styles.bankCode}>{bank.code}</Text>
          <Text style={styles.bankArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderWalletPayment = () => (
    <View style={styles.paymentFormContainer}>
      <Text style={styles.sectionTitle}>Choose Wallet</Text>
      
      {wallets.map((wallet) => (
        <TouchableOpacity
          key={wallet.id}
          style={styles.walletOption}
          onPress={() => handlePaymentMethodSelect({ id: 'wallet', name: wallet.name })}
        >
          <Text style={styles.walletIcon}>{wallet.icon}</Text>
          <Text style={styles.walletName}>{wallet.name}</Text>
          <Text style={styles.walletArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEMIPayment = () => (
    <View style={styles.paymentFormContainer}>
      <Text style={styles.sectionTitle}>EMI Options</Text>
      
      <View style={styles.emiOption}>
        <Text style={styles.emiText}>3 months EMI</Text>
        <Text style={styles.emiAmount}>₹{(amount / 3).toFixed(2)}/month</Text>
      </View>
      
      <View style={styles.emiOption}>
        <Text style={styles.emiText}>6 months EMI</Text>
        <Text style={styles.emiAmount}>₹{(amount / 6).toFixed(2)}/month</Text>
      </View>
      
      <View style={styles.emiOption}>
        <Text style={styles.emiText}>12 months EMI</Text>
        <Text style={styles.emiAmount}>₹{(amount / 12).toFixed(2)}/month</Text>
      </View>
      
      <TouchableOpacity
        style={styles.payButton}
        onPress={() => handlePaymentMethodSelect({ id: 'emi', name: 'EMI' })}
      >
        <Text style={styles.payButtonText}>Select EMI Plan</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPaymentForm = () => {
    if (!selectedMethod) return renderPaymentMethods();
    
    switch (selectedMethod.id) {
      case 'card': return renderCardPayment();
      case 'upi': return renderUPIPayment();
      case 'netbanking': return renderNetBanking();
      case 'wallet': return renderWalletPayment();
      case 'emi': return renderEMIPayment();
      default: return renderPaymentMethods();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Razorpay</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>₹{amount.toFixed(2)}</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c3e50" />
            <Text style={styles.loadingText}>{loadingStage || 'Processing payment...'}</Text>
            <Text style={styles.loadingSubtext}>Please don't close this window</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {showPaymentForm && renderPaymentForm()}
          </ScrollView>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Secured by Razorpay</Text>
          <Text style={styles.footerSubtext}>Your payment information is encrypted</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    backgroundColor: '#2c3e50',
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 30,
  },
  amountContainer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  paymentMethodsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderLeftWidth: 4,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
    borderRadius: 8,
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  paymentMethodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  paymentMethodArrow: {
    fontSize: 20,
    color: '#666',
  },
  paymentFormContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  inputText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  row: {
    flexDirection: 'row',
  },
  payButton: {
    backgroundColor: '#2c3e50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  upiApp: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
    borderRadius: 8,
  },
  upiAppIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  upiAppName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  upiAppArrow: {
    fontSize: 20,
    color: '#666',
  },
  divider: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
  },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
    borderRadius: 8,
  },
  bankName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  bankCode: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  bankArrow: {
    fontSize: 20,
    color: '#666',
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
    borderRadius: 8,
  },
  walletIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  walletName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  walletArrow: {
    fontSize: 20,
    color: '#666',
  },
  emiOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
    borderRadius: 8,
  },
  emiText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  emiAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  footerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default MockRazorpayWebView;
