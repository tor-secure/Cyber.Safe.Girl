# Razorpay Integration Troubleshooting Guide

## Issue: "Bad Request" Error

If you're experiencing a "bad request" error with Razorpay integration, this guide will help you identify and fix the issue.

## Root Cause Analysis

The "bad request" error typically occurs due to one of these issues:

### 1. **Missing or Invalid Razorpay Credentials** ⚠️
**Most Common Cause**

**Symptoms:**
- "Bad request" error when trying to make payment
- Console errors about undefined Razorpay key
- Payment gateway not loading

**Solution:**
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)
2. Generate API keys (Test keys for development)
3. Update `.env.local` file with actual credentials:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_actual_key_id
   RAZORPAY_KEY_SECRET=your_actual_secret_key
   ```

### 2. **Mock Implementation Still Active**
**Fixed in Latest Update**

**Previous Issue:**
- The original code used mock/fake Razorpay functions
- Orders were created with fake IDs that don't exist in Razorpay

**Solution Applied:**
- ✅ Replaced mock functions with actual Razorpay SDK calls
- ✅ Added proper signature verification
- ✅ Implemented real order creation

### 3. **Missing Razorpay SDK**
**Fixed in Latest Update**

**Previous Issue:**
- Razorpay Node.js SDK was not installed

**Solution Applied:**
- ✅ Added `razorpay` package to dependencies
- ✅ Implemented proper SDK initialization

### 4. **Frontend Script Loading Issues**

**Symptoms:**
- "Razorpay is not defined" error
- Payment modal doesn't open

**Solution:**
- Check browser console for script loading errors
- Ensure internet connection is stable
- The app now includes better error handling for script loading

### 5. **Amount Format Issues**

**Symptoms:**
- Order creation fails with amount-related errors

**Solution Applied:**
- ✅ Proper amount conversion (rupees to paise)
- ✅ Amount validation added
- ✅ Better error messages for amount issues

## Step-by-Step Fix Guide

### Step 1: Get Razorpay Credentials
1. Sign up at [Razorpay](https://razorpay.com) if you haven't already
2. Complete basic account setup
3. Go to Settings → API Keys
4. Generate Test API Keys
5. Copy both Key ID and Key Secret

### Step 2: Configure Environment Variables
1. Open `.env.local` file in project root
2. Replace placeholder values:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_actual_key_id_here
   RAZORPAY_KEY_SECRET=your_actual_key_secret_here
   ```
3. Save the file

### Step 3: Test Configuration
Run the test script to verify setup:
```bash
node test-razorpay-config.js
```

Expected output for working setup:
```
✅ Razorpay instance created successfully
✅ Test order created successfully!
🎉 Razorpay integration is working correctly!
```

### Step 4: Restart Development Server
```bash
npm run dev
```

### Step 5: Test Payment Flow
1. Navigate to payment page
2. Fill in required details
3. Click "Pay Now"
4. Use test card details:
   - Card: 4111 1111 1111 1111
   - Expiry: Any future date
   - CVV: Any 3 digits

## Verification Checklist

- [ ] Razorpay account created and verified
- [ ] Test API keys generated
- [ ] Environment variables properly set in `.env.local`
- [ ] Development server restarted after env changes
- [ ] Test script runs successfully
- [ ] Browser console shows no Razorpay-related errors
- [ ] Payment modal opens when clicking "Pay Now"

## Common Error Messages and Solutions

### "Payment gateway is not configured"
- **Cause:** Missing environment variables
- **Fix:** Set proper Razorpay credentials in `.env.local`

### "Razorpay is not defined"
- **Cause:** Script loading failed
- **Fix:** Check internet connection, refresh page

### "Invalid payment details"
- **Cause:** Malformed request data
- **Fix:** Check amount format and required fields

### "Payment gateway configuration error"
- **Cause:** Invalid API credentials
- **Fix:** Verify Key ID and Secret are correct

### "Order not found"
- **Cause:** Order ID mismatch or expired order
- **Fix:** Create new order, check order creation logs

## Debug Mode

To enable detailed logging, add this to your `.env.local`:
```env
NODE_ENV=development
```

This will show detailed console logs for:
- Order creation process
- Payment verification steps
- Error details

## Production Considerations

When moving to production:

1. **Switch to Live Credentials:**
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_live_key_id
   RAZORPAY_KEY_SECRET=your_live_secret_key
   ```

2. **Complete KYC:** Ensure Razorpay account is fully verified

3. **Set up Webhooks:** For reliable payment status updates

4. **Enable HTTPS:** Required for live payments

5. **Test thoroughly:** Use small amounts for initial testing

## Getting Help

If issues persist:

1. **Check Logs:** Look at both browser console and server logs
2. **Razorpay Dashboard:** Check if orders are being created
3. **Test Script:** Run `node test-razorpay-config.js` for diagnostics
4. **Razorpay Support:** Contact Razorpay support with specific error messages

## Recent Fixes Applied

✅ **Replaced mock Razorpay implementation with real SDK**
✅ **Added proper environment variable validation**
✅ **Implemented actual signature verification**
✅ **Added comprehensive error handling**
✅ **Included amount validation and conversion**
✅ **Added script loading error detection**
✅ **Created configuration test script**

The integration should now work properly once you provide valid Razorpay credentials.