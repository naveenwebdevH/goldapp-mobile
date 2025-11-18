// Mock Razorpay implementation for Expo Go compatibility
// This simulates Razorpay checkout for development and testing

export const MockRazorpayCheckout = {
  open: async (options) => {
    console.log('🧪 Mock Razorpay - Opening checkout with options:', options);
    
    // Simulate a delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate user interaction
    return new Promise((resolve, reject) => {
      // For development, we'll simulate a successful payment
      // In a real app, you'd show a modal or navigate to a payment screen
      
      const mockPaymentData = {
        razorpay_payment_id: 'pay_mock_' + Date.now(),
        razorpay_order_id: options.order_id,
        razorpay_signature: 'mock_signature_' + Date.now()
      };
      
      // Simulate 90% success rate for testing
      if (Math.random() > 0.1) {
        console.log('🧪 Mock Razorpay - Payment successful:', mockPaymentData);
        resolve(mockPaymentData);
      } else {
        console.log('🧪 Mock Razorpay - Payment failed (simulated)');
        reject({
          code: 'PAYMENT_FAILED',
          description: 'Payment failed (simulated for testing)'
        });
      }
    });
  }
};

// Export as default for compatibility
export default MockRazorpayCheckout;
