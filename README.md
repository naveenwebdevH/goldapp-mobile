# GoldApp Mobile - Digital Gold Savings App

A comprehensive React Native mobile application for digital gold trading, fixed deposits, and systematic investment plans, integrated with Augmont APIs.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device

### Installation & Setup
```bash
# Install dependencies
npm install

# Start the development server
npm start

# Scan QR code with Expo Go app to run on device
```

### Running on Simulator
- **iOS**: Press `i` in terminal
- **Android**: Press `a` in terminal
- **Web**: Press `w` in terminal

## 🚀 Features

### Core Features
- **Mobile OTP Authentication** - Secure login with SMS verification
- **Real-time Gold/Silver Rates** - Live market rates with rate limiting
- **Gold Trading** - Buy and sell gold with instant processing
- **Fixed Deposits** - Gold FD schemes with interest payments
- **SIP Plans** - Systematic investment plans for gold
- **Peer-to-Peer Transfers** - Send/receive gold between users
- **Physical Gold Delivery** - Order physical gold products
- **Professional Invoicing** - Generate and download invoices
- **Transaction Passbook** - Complete transaction history
- **Real-time Webhooks** - Instant notifications for all activities

### Technical Features
- **Complete Augmont Integration** - 25 API categories, 100+ endpoints
- **Real-time Updates** - Live rates, webhooks, notifications
- **Secure Authentication** - JWT tokens, input validation
- **Offline Support** - Fallback data and error handling
- **Responsive Design** - Optimized for all screen sizes
- **Performance Optimized** - Fast loading and smooth animations

## 📱 Screens

### Authentication Flow
1. **Splash Screen** - App loading with animations
2. **Mobile Login** - Phone number input with validation
3. **OTP Verification** - 6-digit OTP verification
4. **Profile Setup** - User details and KYC information
5. **KYC Verification** - Identity verification status

### Main App
1. **Dashboard** - Portfolio overview, rates, quick actions
2. **Buy Gold** - Purchase gold with live rates
3. **Sell Gold** - Sell gold holdings
4. **FD Management** - Fixed deposit schemes and management
5. **SIP Plans** - Systematic investment plans
6. **Transfers** - Peer-to-peer gold transfers
7. **Orders** - Physical gold delivery orders
8. **Passbook** - Complete transaction history
9. **Profile** - User profile and settings

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd goldapp-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 🔧 Configuration

### API Configuration
Update the API base URL in `src/config/api.js`:
```javascript
export const API_BASE_URL = 'https://rozgold.in/api';
```

### Environment Variables
Create a `.env` file in the root directory:
```env
API_BASE_URL=https://rozgold.in/api
EXPO_PUBLIC_API_URL=https://rozgold.in/api
```

## 📦 Dependencies

### Core Dependencies
- **expo** - Expo SDK
- **react** - React framework
- **react-native** - React Native framework
- **@react-navigation/native** - Navigation library
- **@react-navigation/stack** - Stack navigator

### UI Dependencies
- **expo-linear-gradient** - Gradient backgrounds
- **@expo/vector-icons** - Icon library
- **react-native-phone-number-input** - Phone input component
- **react-native-animatable** - Animations

### Storage Dependencies
- **@react-native-async-storage/async-storage** - Local storage

## 🏗️ Project Structure

```
goldapp-mobile/
├── src/
│   ├── screens/
│   │   ├── SplashScreen.js
│   │   ├── auth/
│   │   │   ├── MobileLoginScreen.js
│   │   │   ├── OTPVerificationScreen.js
│   │   │   ├── ProfileSetupScreen.js
│   │   │   └── KYCVerificationScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── gold/
│   │   │   ├── BuyGoldScreen.js
│   │   │   └── SellGoldScreen.js
│   │   ├── fd/
│   │   │   ├── FDSchemesScreen.js
│   │   │   ├── CreateFDScreen.js
│   │   │   └── FDManagementScreen.js
│   │   ├── sip/
│   │   │   ├── SIPPlansScreen.js
│   │   │   ├── CreateSIPScreen.js
│   │   │   └── SIPManagementScreen.js
│   │   ├── transfers/
│   │   │   ├── TransferScreen.js
│   │   │   └── TransferHistoryScreen.js
│   │   ├── orders/
│   │   │   ├── OrdersScreen.js
│   │   │   └── OrderDetailsScreen.js
│   │   ├── passbook/
│   │   │   └── PassbookScreen.js
│   │   └── profile/
│   │       ├── ProfileScreen.js
│   │       └── SettingsScreen.js
│   ├── components/
│   │   ├── common/
│   │   └── forms/
│   ├── config/
│   │   └── api.js
│   ├── services/
│   │   ├── auth.js
│   │   ├── gold.js
│   │   ├── fd.js
│   │   └── sip.js
│   └── utils/
│       ├── validation.js
│       ├── formatting.js
│       └── constants.js
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
├── App.js
├── package.json
├── app.json
└── README.md
```

## 🔌 API Integration

### Authentication APIs
- `POST /api/auth/send-otp.php` - Send OTP to mobile number
- `POST /api/auth/verify-otp.php` - Verify OTP and login

### User Management APIs
- `POST /api/users/create.php` - Create user account
- `PUT /api/users/update.php` - Update user account
- `GET /api/users/profile.php` - Get user profile
- `GET /api/users/passbook.php` - Get user passbook

### Gold Trading APIs
- `POST /api/gold/buy.php` - Buy gold
- `POST /api/gold/sell.php` - Sell gold
- `GET /api/gold/buy-list.php` - List buy transactions
- `GET /api/gold/sell-list.php` - List sell transactions

### Rates APIs
- `GET /api/rates/live.php` - Get live gold/silver rates
- `GET /api/rates/historical.php` - Get historical rates

### FD Management APIs
- `GET /api/fd/schemes.php` - Get FD schemes
- `POST /api/fd/create.php` - Create FD
- `GET /api/fd/list.php` - List user FDs
- `PUT /api/fd/close.php` - Close FD

### SIP Management APIs
- `GET /api/sip/rates.php` - Get SIP rates and plans

### Transfer APIs
- `POST /api/transfers/create.php` - Create transfer
- `GET /api/transfers/list.php` - List transfers

### Order APIs
- `POST /api/orders/create.php` - Create order
- `GET /api/orders/list.php` - List orders

### Invoice APIs
- `GET /api/invoices/buy.php` - Get buy invoice
- `GET /api/invoices/sell.php` - Get sell invoice
- `GET /api/invoices/redeem.php` - Get redeem invoice

## 🎨 UI/UX Features

### Design System
- **Dark Theme** - Modern dark interface
- **Gold Accents** - Gold color scheme throughout
- **Gradient Backgrounds** - Beautiful gradient effects
- **Smooth Animations** - Fluid transitions and animations
- **Responsive Layout** - Adapts to all screen sizes

### User Experience
- **Intuitive Navigation** - Easy-to-use interface
- **Real-time Updates** - Live data and notifications
- **Offline Support** - Works without internet
- **Error Handling** - Graceful error management
- **Loading States** - Clear feedback for all actions

## 🔒 Security Features

### Authentication
- **OTP Verification** - SMS-based authentication
- **JWT Tokens** - Secure session management
- **Input Validation** - Client and server-side validation
- **Rate Limiting** - API call limits

### Data Protection
- **Encrypted Storage** - Secure local data storage
- **HTTPS** - Secure API communication
- **Input Sanitization** - XSS protection
- **Error Handling** - No sensitive data exposure

## 🚀 Deployment

### Development
1. Start the Expo development server
2. Scan QR code with Expo Go app
3. Test on real device or simulator

### Production
1. Build the app for production
2. Deploy to app stores
3. Configure production API endpoints

## 📱 Platform Support

### iOS
- iOS 11.0 or higher
- iPhone and iPad support
- iOS Simulator support

### Android
- Android 6.0 (API level 23) or higher
- Phone and tablet support
- Android Emulator support

### Web
- Modern web browsers
- Responsive design
- PWA support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

### Version 1.0.0
- Initial release
- Complete Augmont API integration
- All core features implemented
- Production-ready mobile app

---

**Built with ❤️ using React Native and Expo**
