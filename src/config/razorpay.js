// Razorpay Configuration
export const RAZORPAY_CONFIG = {
  // Razorpay Key ID (Public Key)
  keyId: 'rzp_test_8tqOH9zZPJUWd0', // Your actual Razorpay Key ID
  
  // Merchant Details
  merchantName: 'GoldApp',
  merchantDescription: 'Gold Investment Platform',
  
  // Currency
  currency: 'INR',
  
  // Theme
  theme: {
    color: '#1E40AF', // Blue theme to match app
  },
  
  // Payment Methods
  paymentMethods: {
    netbanking: true,
    wallet: true,
    upi: true,
    emi: true,
    card: true,
  },
  
  // Prefill (Optional)
  prefill: {
    email: '',
    contact: '',
    name: '',
  },
  
  // Notes
  notes: {
    source: 'mobile_app',
    platform: 'react_native',
  },
};

// Razorpay Options Helper
export const createRazorpayOptions = (amount, orderId, userInfo = {}) => {
  return {
    description: 'Gold Purchase',
    image: 'https://your-logo-url.com/logo.png', // Replace with your logo
    currency: RAZORPAY_CONFIG.currency,
    key: RAZORPAY_CONFIG.keyId,
    amount: Math.round(amount * 100), // Convert to paise
    name: RAZORPAY_CONFIG.merchantName,
    order_id: orderId,
    prefill: {
      email: userInfo.email || '',
      contact: userInfo.mobile || '',
      name: userInfo.name || '',
    },
    theme: RAZORPAY_CONFIG.theme,
    ...RAZORPAY_CONFIG.paymentMethods,
  };
};
