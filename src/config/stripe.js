// Stripe Configuration
export const STRIPE_CONFIG = {
  // Test keys - Your actual Stripe keys
  publishableKey: 'pk_test_51RGNCfROYO3OXBre1hfUNMupvXfMNGayqzZcbXd57W9foo6yVdmVhGUOJQB8zYHHPJwCG8xc5Vh6YzLA8fVxnlb6009eAag4jV',
  merchantIdentifier: 'merchant.com.goldapp',
  urlScheme: 'goldapp',
  
  // Production keys (uncomment when ready for production)
  // publishableKey: 'pk_live_your_live_publishable_key_here',
  // merchantIdentifier: 'merchant.com.goldapp',
  // urlScheme: 'goldapp',
};

// Payment method configuration
export const PAYMENT_METHODS = {
  card: {
    name: 'Credit/Debit Card',
    icon: '💳',
    enabled: true
  },
  upi: {
    name: 'UPI',
    icon: '📱',
    enabled: true
  },
  netbanking: {
    name: 'Net Banking',
    icon: '🏦',
    enabled: true
  },
  wallet: {
    name: 'Digital Wallet',
    icon: '💰',
    enabled: true
  }
};

// Currency configuration
export const CURRENCY_CONFIG = {
  code: 'INR',
  symbol: '₹',
  decimals: 2
};
