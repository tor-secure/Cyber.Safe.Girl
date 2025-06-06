#!/usr/bin/env node

/**
 * Test script to verify Razorpay configuration
 * Run with: node test-razorpay-config.js
 */

require('dotenv').config({ path: '.env.local' });

const Razorpay = require('razorpay');

async function testRazorpayConfig() {
  console.log('🔍 Testing Razorpay Configuration...\n');

  // Check environment variables
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  console.log('📋 Environment Variables:');
  console.log(`Key ID: ${keyId ? '✅ Set' : '❌ Missing'}`);
  console.log(`Key Secret: ${keySecret ? '✅ Set' : '❌ Missing'}\n`);

  if (!keyId || !keySecret) {
    console.log('❌ Missing Razorpay credentials in .env.local file');
    console.log('Please add the following to your .env.local file:');
    console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here');
    console.log('RAZORPAY_KEY_SECRET=your_key_secret_here');
    return;
  }

  // Validate key format
  if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
    console.log('❌ Invalid Key ID format. Should start with rzp_test_ or rzp_live_');
    return;
  }

  console.log('🔧 Initializing Razorpay instance...');
  
  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    console.log('✅ Razorpay instance created successfully\n');

    // Test order creation
    console.log('🧪 Testing order creation...');
    
    const orderOptions = {
      amount: 99900, // ₹999 in paise
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now(),
    };

    const order = await razorpay.orders.create(orderOptions);
    
    console.log('✅ Test order created successfully!');
    console.log(`Order ID: ${order.id}`);
    console.log(`Amount: ₹${order.amount / 100}`);
    console.log(`Status: ${order.status}\n`);

    console.log('🎉 Razorpay integration is working correctly!');
    console.log('You can now proceed with payment testing in your application.');

  } catch (error) {
    console.log('❌ Razorpay configuration test failed:');
    console.error(error.message);
    
    if (error.statusCode === 401) {
      console.log('\n💡 This usually means:');
      console.log('- Invalid API credentials');
      console.log('- Key ID and Key Secret don\'t match');
      console.log('- Using test credentials with live endpoint or vice versa');
    }
  }
}

// Run the test
testRazorpayConfig().catch(console.error);