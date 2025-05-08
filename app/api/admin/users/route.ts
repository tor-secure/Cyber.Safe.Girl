// User management API
import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/server-admin-auth"
import { getAuth } from "firebase-admin/auth"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

// Get a single user by ID
async function getUserById(userId: string) {
  try {
    // Get user from Firebase Auth
    const auth = getAuth();
    const userRecord = await auth.getUser(userId);
    
    // Get user from Firestore
    if (!adminDb) {
      throw new Error("Admin database not initialized");
    }
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    
    // Check if this is the test admin account
    const email = userRecord.email || userData?.email || "No email";
    const isTestAdmin = email === "test@test.com";
    
    // Combine data
    return {
      id: userRecord.uid,
      name: userRecord.displayName || userData?.name || "Unknown",
      email: email,
      status: userData?.status || (userData?.completedAt ? "completed" : "active"),
      role: isTestAdmin || userData?.isAdmin ? "admin" : "user",
      createdAt: userRecord.metadata.creationTime || userData?.createdAt || new Date().toISOString(),
      lastLogin: userRecord.metadata.lastSignInTime || userData?.lastLogin || "Never",
      authProvider: userRecord.providerData && userRecord.providerData.length > 0
        ? userRecord.providerData[0].providerId
        : "password",
      progress: userData?.progress || {}
    };
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("Admin users API called")

    // Verify admin session
    console.log("Verifying admin session...")
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      console.log("Admin verification failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("Admin verification successful")

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    try {
      // Get Firebase Auth instance
      const auth = getAuth()

      // Fetch all users from Firebase Auth first (this will include Google/email users)
      console.log("Fetching users from Firebase Auth...")
      let authUsers: any[] = []

      try {
        // List all users from Firebase Auth
        // Note: This is paginated, in a real app you'd handle pagination properly
        const listUsersResult = await auth.listUsers(1000)
        authUsers = listUsersResult.users.map((userRecord) => ({
          id: userRecord.uid,
          name: userRecord.displayName || "Unknown",
          email: userRecord.email || "No email",
          status: "active", // Default status
          role: "user", // Default role
          createdAt: userRecord.metadata.creationTime || new Date().toISOString(),
          lastLogin: userRecord.metadata.lastSignInTime || "Never",
          authProvider:
            userRecord.providerData && userRecord.providerData.length > 0
              ? userRecord.providerData[0].providerId
              : "password",
        }))

        console.log(`Found ${authUsers.length} users in Firebase Auth`)
      } catch (authError) {
        console.error("Error fetching users from Firebase Auth:", authError)
        // Continue with Firestore users even if Auth fetch fails
      }

      // Fetch users from Firestore to get additional data
      console.log("Fetching users from Firestore...")
      if (!adminDb) {
        throw new Error("Admin database not initialized");
      }
      const usersRef = adminDb.collection("users")
      const usersSnapshot = await usersRef.get()

      // Define the user type
      interface User {
        id: string
        email: string
        name: string
        role: string
        status: string
        createdAt: string
        lastLogin: string
        authProvider?: string
        [key: string]: any
      }

      let firestoreUsers: User[] = []

      if (!usersSnapshot.empty) {
        // Convert to array
        firestoreUsers = usersSnapshot.docs.map((doc) => {
          const data = doc.data()
          // Special case for test@test.com - always set as admin
          const isTestAdmin = data.email === "test@test.com";
          
          return {
            id: doc.id,
            name: data.name || "Unknown",
            email: data.email || "No email",
            status: data.status || (data.completedAt ? "completed" : "active"),
            role: isTestAdmin || data.isAdmin ? "admin" : "user",
            createdAt: data.createdAt || new Date().toISOString(),
            lastLogin: data.lastLogin || "Unknown",
          }
        })

        console.log(`Found ${firestoreUsers.length} users in Firestore`)
      }

      // Merge users from both sources, prioritizing Firestore data
      const mergedUsers: User[] = [...authUsers]

      // Update auth users with Firestore data where available
      firestoreUsers.forEach((firestoreUser) => {
        const existingUserIndex = mergedUsers.findIndex((u) => u.id === firestoreUser.id)

        if (existingUserIndex >= 0) {
          // Update existing user with Firestore data
          mergedUsers[existingUserIndex] = {
            ...mergedUsers[existingUserIndex],
            ...firestoreUser,
            // Keep auth provider from Auth data
            authProvider: mergedUsers[existingUserIndex].authProvider,
          }
        } else {
          // Add new user from Firestore
          mergedUsers.push(firestoreUser)
        }
      })
      
      // Final pass to ensure test@test.com is always an admin
      mergedUsers.forEach((user, index) => {
        if (user.email === "test@test.com") {
          mergedUsers[index] = {
            ...user,
            role: "admin"
          }
        }
      })

      // Sort by creation date (newest first)
      mergedUsers.sort((a: any, b: any) => {
        return new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
      })

      console.log(`Returning ${mergedUsers.length} total users`)
      return NextResponse.json({ users: mergedUsers })
    } catch (dbError) {
      console.error("Database error when fetching users:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : "Database error when fetching users"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error("Unexpected error fetching users:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch users"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// PUT: Update user
export async function PUT(request: NextRequest) {
  try {
    // Verify admin session
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { userId, userData } = body;

    if (!userId || !userData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update user in Firestore
    if (!adminDb) {
      throw new Error("Admin database not initialized");
    }
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      await userRef.set({
        ...userData,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Update existing user document
      await userRef.update({
        ...userData,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Update user in Firebase Auth if name or email is changed
    if (userData.name || userData.email) {
      const auth = getAuth();
      try {
        const updateParams: any = {};
        
        if (userData.name) {
          updateParams.displayName = userData.name;
        }
        
        if (userData.email) {
          updateParams.email = userData.email;
        }
        
        if (Object.keys(updateParams).length > 0) {
          await auth.updateUser(userId, updateParams);
        }
      } catch (authError) {
        console.error("Error updating user in Firebase Auth:", authError);
        // Continue even if Auth update fails
      }
    }

    // Get updated user
    const updatedUser = await getUserById(userId);
    
    return NextResponse.json({ 
      success: true, 
      message: "User updated successfully", 
      user: updatedUser 
    });
  } catch (error) {
    console.error("Error updating user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Delete user
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin session
    const isAdmin = await verifyAdminSession(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from URL
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Delete user from Firebase Auth
    const auth = getAuth();
    try {
      await auth.deleteUser(userId);
    } catch (authError) {
      console.error("Error deleting user from Firebase Auth:", authError);
      // Continue even if Auth delete fails
    }

    // Delete user from Firestore
    if (!adminDb) {
      throw new Error("Admin database not initialized");
    }
    await adminDb.collection("users").doc(userId).delete();

    // Also delete user progress
    try {
      if (!adminDb) {
        throw new Error("Admin database not initialized");
      }
      await adminDb.collection("userProgress").doc(userId).delete();
    } catch (progressError) {
      console.error("Error deleting user progress:", progressError);
      // Continue even if progress delete fails
    }

    return NextResponse.json({ 
      success: true, 
      message: "User deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}