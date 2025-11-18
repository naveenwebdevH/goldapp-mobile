import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const RazorpayWebView = ({ 
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
  const [loading, setLoading] = useState(true);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.success) {
        onSuccess({
          razorpay_payment_id: data.payment_id,
          razorpay_order_id: data.order_id,
          razorpay_signature: data.signature
        });
      } else {
        onError(data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Error parsing payment response:', error);
      onError('Invalid payment response');
    }
  };

  const webViewUrl = `https://rozgold.in/api/payments/razorpay/web-checkout.php?` +
    `order_id=${orderId}&` +
    `amount=${amount}&` +
    `currency=${currency}&` +
    `merchant_name=${encodeURIComponent(merchantName)}&` +
    `user_name=${encodeURIComponent(userName)}&` +
    `user_email=${encodeURIComponent(userEmail)}&` +
    `user_mobile=${encodeURIComponent(userMobile)}`;

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
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <View style={styles.placeholder} />
        </View>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c3e50" />
            <Text style={styles.loadingText}>Loading payment...</Text>
          </View>
        )}
        
        <WebView
          source={{ uri: webViewUrl }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  webview: {
    flex: 1,
  },
});

export default RazorpayWebView;
