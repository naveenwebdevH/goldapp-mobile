# Razorpay Integration Setup

## Current Status: Mock Implementation (Expo Go Compatible)

The app currently uses a **mock Razorpay implementation** that works with Expo Go for development and testing.

## For Production: Real Razorpay SDK

To use the real Razorpay SDK in production, you need to create a development build:

### 1. Install Razorpay SDK
```bash
npm install react-native-razorpay
```

### 2. Create Development Build
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Create development build
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

### 3. Update Code for Production
In `GoldBuyScreen.js`, uncomment the real import:
```javascript
import RazorpayCheckout from 'react-native-razorpay';
```

And comment out the mock:
```javascript
// import MockRazorpayCheckout from '../utils/mockRazorpay';
// const RazorpayCheckout = MockRazorpayCheckout;
```

### 4. Configure Razorpay Keys
Update your Razorpay keys in:
- `config/api_config.php` (Backend)
- `goldapp-mobile/src/config/razorpay.js` (Mobile)

## Mock Implementation Features

The current mock implementation:
- ✅ Simulates payment flow
- ✅ Works with Expo Go
- ✅ Tests backend APIs
- ✅ Shows success/failure scenarios
- ✅ Maintains same interface as real SDK

## Testing Payment Flow

1. **Start the app** in Expo Go
2. **Navigate to Buy Gold**
3. **Enter amount** (minimum ₹50)
4. **Click "Buy Gold"**
5. **Mock payment** will process automatically
6. **Success message** will show
7. **Redirect** to transaction history

## Backend APIs

The backend Razorpay APIs are fully functional:
- `api/payments/razorpay/create-order.php` - Creates orders
- `api/payments/razorpay/verify-payment.php` - Verifies payments

## Database

The `razorpay_orders` table stores all payment transactions.

## Next Steps

1. **Test the mock implementation** in Expo Go
2. **Verify backend APIs** work correctly
3. **Create development build** for real Razorpay testing
4. **Deploy to production** with real Razorpay keys
