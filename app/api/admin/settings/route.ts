import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdminSession } from "@/lib/server-admin-auth"

// GET: Fetch settings
export async function GET(request: NextRequest) {
  try {
    console.log("Admin settings API called")
    
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
      // Fetch settings from Firestore
      console.log("Fetching settings from database...")
      const settingsRef = adminDb.collection("settings").doc("general")
      const settingsDoc = await settingsRef.get()
      
      if (!settingsDoc.exists) {
        console.log("No settings found in database, creating default settings")
        // Create default settings
        const defaultSettings = {
          siteName: "Cyber Safe Girl",
          siteDescription: "Empowering women with cybersecurity knowledge",
          contactEmail: "contact@cybersafegirl.com",
          maintenanceMode: false,
          allowRegistration: true,
          emailNotifications: true,
          userRegistrationAlerts: true,
          certificateIssuedAlerts: true,
          sessionTimeout: 60,
          requireTwoFactor: false,
          ipRestriction: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await settingsRef.set(defaultSettings)
        return NextResponse.json({ settings: defaultSettings })
      }
      
      const settings = settingsDoc.data()
      console.log("Settings retrieved successfully")
      
      return NextResponse.json({ settings })
    } catch (dbError) {
      console.error("Database error when fetching settings:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : "Database error when fetching settings"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error("Unexpected error fetching settings:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch settings"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST: Update settings
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

    const settings = await request.json()
    
    try {
      // Update settings in Firestore
      const settingsRef = adminDb.collection("settings").doc("general")
      
      // Add updatedAt timestamp
      const updatedSettings = {
        ...settings,
        updatedAt: new Date().toISOString()
      }
      
      await settingsRef.set(updatedSettings, { merge: true })
      
      return NextResponse.json({ 
        success: true, 
        settings: updatedSettings
      })
    } catch (dbError) {
      console.error("Database error when updating settings:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : "Database error when updating settings"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error("Unexpected error updating settings:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update settings"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}