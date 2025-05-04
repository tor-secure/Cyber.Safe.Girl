# Admin Dashboard Setup

This document provides instructions on how to set up the admin dashboard for the Cyber Safe Girl (CSG) project.

## Setting Up Admin Users

To set up an admin user, follow these steps:

1. First, make sure the user is registered in the system using the regular registration process.

2. Once the user is registered, you need to set the admin claim for the user using the provided script:

```bash
# Install required dependencies if not already installed
npm install dotenv

# Set up environment variables (make sure these are set in your .env file)
# NEXT_PUBLIC_FIREBASE_PROJECT_ID
# NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL
# NEXT_PUBLIC_FIREBASE_PRIVATE_KEY

# Run the script to set admin claim
node scripts/set-admin-user.js admin@example.com
```

Replace `admin@example.com` with the email of the user you want to make an admin.

3. After setting the admin claim, the user can now access the admin dashboard at `/admin/login`.

## Admin Dashboard Features

The admin dashboard provides the following features:

1. **Generate Coupons**: Create individual coupon codes with specific discount percentages, maximum uses, and expiry dates.

2. **Generate Multiple Coupons**: Create multiple coupon codes at once with a common prefix.

3. **Manage Coupons**: View all existing coupons, their usage statistics, and status.

## Coupon System

The coupon system allows:

- Setting discount percentages (1-100%)
- Setting maximum uses per coupon
- Setting expiry dates
- Tracking coupon usage

When a user applies a valid coupon, they can access the final test without payment.

## Technical Implementation

The admin dashboard is implemented using:

- Next.js for the frontend
- Firebase Authentication for admin authentication
- Firebase Firestore for storing coupon data
- Custom middleware for protecting admin routes

The system uses Firebase Auth custom claims to identify admin users, ensuring that only authorized users can access the admin dashboard and generate coupons.