// GET: Fetch all users
import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/server-admin-auth"
import { getAuth } from "firebase-admin/auth"
import { adminDb } from "@/lib/firebase-admin"

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
          return {
            id: doc.id,
            name: data.name || "Unknown",
            email: data.email || "No email",
            status: data.status || (data.completedAt ? "completed" : "active"),
            role: data.isAdmin ? "admin" : "user",
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
