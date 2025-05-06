import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdminSession } from "@/lib/server-admin-auth"

// GET: Fetch all certificates
export async function GET(request: NextRequest) {
  try {
    console.log("Admin certificates API called")
    
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
      // Fetch all certificates
      console.log("Fetching certificates from database...")
      const certificatesRef = adminDb.collection("certificates")
      const certificatesSnapshot = await certificatesRef.get()

      if (certificatesSnapshot.empty) {
        console.log("No certificates found in database")
        return NextResponse.json({ certificates: [] })
      }

      // Convert to array
      const certificates = certificatesSnapshot.docs.map(doc => {
        const data = doc.data()
        // Ensure the document ID is included
        return {
          ...data,
          certificateId: doc.id,
        }
      })

      console.log(`Found ${certificates.length} certificates`)

      // Sort by issue date (newest first)
      certificates.sort((a: any, b: any) => {
        return new Date(b.issueDate || Date.now()).getTime() - new Date(a.issueDate || Date.now()).getTime()
      })

      return NextResponse.json({ certificates })
    } catch (dbError) {
      console.error("Database error when fetching certificates:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : "Database error when fetching certificates"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error("Unexpected error fetching certificates:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch certificates"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}