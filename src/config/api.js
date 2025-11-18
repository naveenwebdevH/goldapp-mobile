// API Configuration for GoldApp Mobile
const API_CONFIG = {
  // Base URL - Update this to your backend URL
  BASE_URL: 'https://rozgold.in/api', // Production API
  // Augmont Merchant API Base URL
  AUGMONT_BASE_URL: 'https://uat-api.augmontgold.com/api/merchant/v1',
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // API Endpoints
  ENDPOINTS: {
  // Authentication (Augmont APIs)
  AUGMONT_LOGIN: '/auth/login',
  SEND_OTP: '/auth/send-otp.php',
  VERIFY_OTP: '/auth/verify-otp.php',
  SEND_EMAIL_OTP: '/auth/send-email-otp-real.php',
  VERIFY_EMAIL_OTP: '/auth/verify-email-otp.php',
    
    // User Management
    USER_PROFILE: '/user/profile.php',
    USER_DASHBOARD: '/user/dashboard.php',
    USER_TRANSACTIONS: '/user/transactions.php',
    
  // User Profile & KYC
  CREATE_USER: '/users/create.php',
  GET_USER_PROFILE: '/users/profile.php',
  UPDATE_USER: '/users/update.php',
  GET_KYC_DETAILS: '/users/kyc/get.php',
  UPDATE_KYC_DETAILS: '/users/kyc/update.php',
  SAVE_USER_INFO: '/users/save-info.php',
  
  // User Bank Management (Augmont APIs)
  CREATE_USER_BANK: '/users/{{unique_id}}/banks',
  GET_USER_BANKS: '/users/{{unique_id}}/banks',
  UPDATE_USER_BANK: '/users/{{unique_id}}/banks/{{user_bank_id}}',
  DELETE_USER_BANK: '/users/{{unique_id}}/banks/{{user_bank_id}}',
    
    // Master Data
    GET_STATES: '/master/states.php',
    GET_CITIES: '/master/cities.php',
    
    // Gold Trading
    GOLD_RATES: '/gold/rates.php',
    BUY_GOLD: '/gold/buy.php',
    SELL_GOLD: '/gold/sell.php',
    
    // SIP Management
    CREATE_SIP: '/sip/create.php',
    SIP_PLANS: '/sip/plans.php',
    SIP_MANAGEMENT: '/sip/management.php',
    
    // KYC
    VERIFY_KYC: '/kyc/verify.php',
    KYC_STATUS: '/kyc/status.php',
    
    // Fixed Deposits
    FD_SCHEMES: '/fd/schemes.php',
    CREATE_FD: '/fd/create.php',
    FD_MANAGEMENT: '/fd/management.php',
    
    // Transfers
    TRANSFER_GOLD: '/transfers/send.php',
    TRANSFER_HISTORY: '/transfers/history.php',
    
    // Orders
    ORDERS: '/orders/list.php',
    ORDER_DETAILS: '/orders/details.php',
    
    // Passbook
    PASSBOOK: '/passbook/transactions.php',
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    INVALID_OTP: 'Invalid OTP. Please enter the correct code.',
    OTP_EXPIRED: 'OTP has expired. Please request a new one.',
    INVALID_MOBILE: 'Invalid mobile number. Please enter a valid 10-digit number.',
    AUTH_FAILED: 'Authentication failed. Please try again.',
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    OTP_SENT: 'OTP sent successfully to your mobile number.',
    OTP_VERIFIED: 'OTP verified successfully.',
    LOGIN_SUCCESS: 'Login successful. Welcome to GoldApp!',
    PROFILE_UPDATED: 'Profile updated successfully.',
  },
};

export default API_CONFIG;
