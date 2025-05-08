import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getAuth } from "firebase-admin/auth"
import { verifyAdminSession } from "@/lib/server-admin-auth"

// GET: Fetch all users
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
      const auth = getAuth();
      
      // Fetch users from Firestore
      console.log("Fetching users from database...")
      const usersRef = adminDb.collection("users")
      const usersSnapshot = await usersRef.get()
      
      // Define the user type
      interface User {
        id: string;
        email: string;
        name: string;
        role: string;
        createdAt: string;
        lastLogin: string;
        [key: string]: any;
      }
      
      let users: User[] = [];
      
      if (usersSnapshot.empty) {
        console.log("No users found in database")
      } else {
        // Convert to array
        users = await Promise.all(usersSnapshot.docs.map(async (doc) => {
          const data = doc.data()
          
          // Try to get additional user info from Firebase Auth
          try {
            const userRecord = await auth.getUser(doc.id);
            return {
              id: doc.id,
              name: data.name || userRecord.displayName || "Unknown",
              email: data.email || userRecord.email || "No email",
              status: data.status || (data.completedAt ? "completed" : "active"),
              role: data.isAdmin ? "admin" : "user",
              createdAt: data.createdAt || userRecord.metadata.creationTime || new Date().toISOString(),
              lastLogin: userRecord.metadata.lastSignInTime || "Never"
            };
          } catch (authError) {
            console.error(`Error fetching auth data for user ${doc.id}:`, authError);
            // Return user with data from Firestore only
            return {
              id: doc.id,
              name: data.name || "Unknown",
              email: data.email || "No email",
              status: data.status || (data.completedAt ? "completed" : "active"),
              role: data.isAdmin ? "admin" : "user",
              createdAt: data.createdAt || new Date().toISOString(),
              lastLogin: "Unknown"
            };
          }
        }));
      }

      // Sort by creation date (newest first)
      users.sort((a: any, b: any) => {
        return new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
      });

      console.log(`Found ${users.length} users`);
      return NextResponse.json({ users })
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

// POST: Create a new user or update an existing one
export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    const { id, name, email, status, role } = await request.json()
    
    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    try {
      // Get Firebase Auth instance
      const auth = getAuth();
      
      let userId = id;
      
      // If no ID provided, create a new user in Firebase Auth
      if (!userId) {
        try {
          // Create user in Firebase Auth
          const userRecord = await auth.createUser({
            email,
            displayName: name,
            // Generate a random password that will be reset on first login
            password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + "!",
          });
          
          userId = userRecord.uid;
          
          // Set admin claim if role is admin
          if (role === "admin") {
            await auth.setCustomUserClaims(userId, { admin: true });
          }
        } catch (authError) {
          console.error("Error creating user in Firebase Auth:", authError);
          return NextResponse.json({ error: "Failed to create user in authentication system" }, { status: 500 });
        }
      } else {
        // Update existing user in Firebase Auth
        try {
          await auth.updateUser(userId, {
            email,
            displayName: name,
          });
          
          // Update admin claim based on role
          const claims = role === "admin" ? { admin: true } : { admin: false };
          await auth.setCustomUserClaims(userId, claims);
        } catch (authError) {
          console.error("Error updating user in Firebase Auth:", authError);
          // Continue with Firestore update even if Auth update fails
        }
      }
      
      // Update or create user in Firestore
      interface UserData {
        name: any;
        email: any;
        status: any;
        isAdmin: boolean;
        updatedAt: string;
        createdAt?: string;
      }
      
      const userData: UserData = {
        name,
        email,
        status,
        isAdmin: role === "admin",
        updatedAt: new Date().toISOString(),
      };
      
      // If new user, add createdAt
      if (!id) {
        userData.createdAt = new Date().toISOString();
      }
      
      await adminDb.collection("users").doc(userId).set(userData, { merge: true });
      
      return NextResponse.json({ 
        success: true, 
        user: {
          id: userId,
          ...userData,
          role: userData.isAdmin ? "admin" : "user"
        }
      });
    } catch (dbError) {
      console.error("Database error when creating/updating user:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : "Database error when creating/updating user";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Unexpected error creating/updating user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create/update user";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Delete a user
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin session
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Get user ID from query params
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    try {
      // Get Firebase Auth instance
      const auth = getAuth();
      
      // Delete user from Firebase Auth
      try {
        await auth.deleteUser(id);
      } catch (authError) {
        console.error("Error deleting user from Firebase Auth:", authError);
        // Continue with Firestore deletion even if Auth deletion fails
      }
      
      // Delete user from Firestore
      await adminDb.collection("users").doc(id).delete();
      
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error("Database error when deleting user:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : "Database error when deleting user";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Unexpected error deleting user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}