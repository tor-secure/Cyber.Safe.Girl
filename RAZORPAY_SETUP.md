# Razorpay Integration Setup Guide

## Overview
This guide will help you set up Razorpay payment integration for the Cyber Safe Girl application.

## Prerequisites
1. A Razorpay account (sign up at https://razorpay.com)
2. Access to your Razorpay dashboard

## Step 1: Get Razorpay Credentials

### For Test Environment:
1. Log in to your Razorpay dashboard
2. Go to Settings → API Keys
3. Generate Test API Keys if not already generated
4. Copy the Key ID and Key Secret

### For Production Environment:
1. Complete KYC verification in your Razorpay account
2. Go to Settings → API Keys
3. Generate Live API Keys
4. Copy the Key ID and Key Secret

## Step 2: Configure Environment Variables

Create or update your `.env.local` file in the project root:

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here

# For production, use:
# NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_live_key_id_here
# RAZORPAY_KEY_SECRET=your_live_key_secret_here
```

**Important Notes:**
- Replace `rzp_test_your_key_id_here` with your actual Razorpay Key ID
- Replace `your_key_secret_here` with your actual Razorpay Key Secret
- The `NEXT_PUBLIC_` prefix is required for the Key ID as it's used in the frontend
- Never expose the Key Secret in frontend code

## Step 3: Install Dependencies

The Razorpay SDK has been added to the project. If you need to reinstall:

```bash
npm install razorpay --legacy-peer-deps
```

## Step 4: Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the payment page in your application
3. Try making a test payment with test card details

### Test Card Details (for Test Mode):
- **Card Number:** 4111 1111 1111 1111
- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **Name:** Any name

## Step 5: Webhook Configuration (Optional but Recommended)

For production environments, set up webhooks to handle payment status updates:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add a new webhook endpoint: `https://yourdomain.com/api/webhook/razorpay`
3. Select events: `payment.captured`, `payment.failed`, `order.paid`
4. Save the webhook secret for verification

## Troubleshooting

### Common Issues:

1. **"Bad Request" Error:**
   - Check if environment variables are properly set
   - Verify Razorpay credentials are correct
   - Ensure the Key ID starts with `rzp_test_` or `rzp_live_`

2. **"Razorpay is not defined" Error:**
   - Check internet connection
   - Verify the Razorpay script is loading properly
   - Check browser console for script loading errors

3. **Payment Verification Failed:**
   - Ensure the Key Secret is correctly set in environment variables
   - Check server logs for signature verification errors

4. **Order Creation Failed:**
   - Verify API credentials
   - Check if the amount is in the correct format (paise for INR)
   - Ensure all required fields are provided

### Debug Steps:

1. Check browser console for JavaScript errors
2. Check server logs for API errors
3. Verify environment variables are loaded:
   ```javascript
   console.log('Razorpay Key ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
   ```

## Security Best Practices

1. **Never expose Key Secret in frontend code**
2. **Always verify payments on the server side**
3. **Use HTTPS in production**
4. **Implement proper error handling**
5. **Log payment attempts for audit purposes**
6. **Set up webhook verification for production**

## Production Checklist

- [ ] KYC verification completed in Razorpay
- [ ] Live API keys generated and configured
- [ ] Webhook endpoints set up
- [ ] SSL certificate installed
- [ ] Payment flow tested end-to-end
- [ ] Error handling implemented
- [ ] Logging and monitoring set up

## Support

If you encounter issues:
1. Check Razorpay documentation: https://razorpay.com/docs/
2. Contact Razorpay support: https://razorpay.com/support/
3. Review server logs and browser console for specific error messages