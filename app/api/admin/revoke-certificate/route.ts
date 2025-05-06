import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdminSession } from "@/lib/server-admin-auth"

// POST: Revoke a certificate
export async function POST(request: NextRequest) {
  try {
    console.log("Revoke certificate API called")
    
    // Verify admin session
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      console.log("Admin verification failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    let certificateId: string
    try {
      const body = await request.json()
      certificateId = body.certificateId
      
      if (!certificateId) {
        return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 })
      }
      
      console.log("Revoking certificate with ID:", certificateId)
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    try {
      // Find the certificate
      const certificateRef = adminDb.collection("certificates").doc(certificateId)
      const certificateSnap = await certificateRef.get()

      if (!certificateSnap.exists) {
        console.log("Certificate not found:", certificateId)
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
      }

      // Check if certificate is already revoked
      const certificateData = certificateSnap.data()
      if (certificateData && certificateData.isValid === false) {
        console.log("Certificate already revoked:", certificateId)
        return NextResponse.json({ 
          message: "Certificate was already revoked",
          certificateId,
          alreadyRevoked: true
        })
      }

      // Update the certificate to mark it as invalid
      await certificateRef.update({
        isValid: false,
        revokedAt: new Date().toISOString(),
      })

      console.log("Certificate revoked successfully:", certificateId)
      return NextResponse.json({ 
        message: "Certificate revoked successfully",
        certificateId
      })
    } catch (dbError) {
      console.error("Database error when revoking certificate:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : "Database error when revoking certificate"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error("Unexpected error revoking certificate:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to revoke certificate"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}