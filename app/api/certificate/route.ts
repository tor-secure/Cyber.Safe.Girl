import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { v4 as uuidv4 } from 'uuid'
import { getCertificateDetails, generateCertificateEncryption, getCertificateDetailsFromEncryption, generateCertificateURLFromEncryption } from "@/lib/certificate-utils"

// Define the structure for certificate data
interface Certificate {
  certificateId: string
  userId: string
  email: string
  name: string
  issueDate: string
  expiryDate: string
  isValid: boolean
  encryptionParams?: {
    ciphertextHex: string
    ivHex: string
    tagHex: string
  } | null
}

// GET: Verify certificate
export async function GET(request: NextRequest) {
  try {
    // Get certificateId from the query parameters
    const url = new URL(request.url)
    const certificateId = url.searchParams.get("certificateId")
    const userId = url.searchParams.get("userId")
    const email = url.searchParams.get("email")

    if (!certificateId) {
      return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 })
    }

    console.log("Certificate API - Certificate ID:", certificateId)
    if (userId) console.log("Certificate API - User ID:", userId)
    if (email) console.log("Certificate API - Email:", email)

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Query the certificate by ID
    const certificateQuery = adminDb.collection("certificates").where("certificateId", "==", certificateId)
    const certificateSnapshot = await certificateQuery.get()

    if (certificateSnapshot.empty) {
      return NextResponse.json({ 
        isValid: false, 
        message: "This certificate is not valid or does not exist in our records." 
      }, { status: 404 })
    }

    // Get the certificate data
    const certificateData = certificateSnapshot.docs[0].data() as Certificate

    // Additional verification if userId or email is provided
    if (userId && certificateData.userId !== userId) {
      return NextResponse.json({ 
        isValid: false, 
        message: "Certificate does not match the provided user ID" 
      }, { status: 400 })
    }

    if (email && certificateData.email !== email) {
      return NextResponse.json({ 
        isValid: false, 
        message: "Certificate does not match the provided email" 
      }, { status: 400 })
    }

    // Check if certificate is expired
    const now = new Date()
    const expiryDate = new Date(certificateData.expiryDate)
    const isExpired = now > expiryDate

    if (isExpired || !certificateData.isValid) {
      return NextResponse.json({ 
        isValid: false, 
        message: isExpired ? "This certificate has expired and is no longer valid." : "This certificate has been revoked and is no longer valid.",
        certificateData: {
          certificateId: certificateData.certificateId,
          name: certificateData.name,
          issueDate: certificateData.issueDate,
          expiryDate: certificateData.expiryDate,
          isValid: false
        }
      })
    }

    // Return certificate verification result
    return NextResponse.json({ 
      isValid: true, 
      message: "Certificate is valid",
      certificateData: {
        certificateId: certificateData.certificateId,
        name: certificateData.name,
        issueDate: certificateData.issueDate,
        expiryDate: certificateData.expiryDate,
        isValid: true
      }
    })
  } catch (error) {
    console.error("Error verifying certificate:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to verify certificate"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST: Generate certificate
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("Certificate API POST - User ID:", userId)

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Get user progress to check if certificate is unlocked
    const userProgressRef = adminDb.collection("userProgress").doc(userId)
    const userProgressSnap = await userProgressRef.get()

    if (!userProgressSnap.exists) {
      return NextResponse.json({ error: "User progress not found" }, { status: 404 })
    }

    const progress = userProgressSnap.data()

    // Check if certificate is unlocked
    if (!progress || !progress.certificateUnlocked) {
      return NextResponse.json({ 
        error: "Certificate is not unlocked. Complete the final test first." 
      }, { status: 403 })
    }

    // Check if user already has a certificate
    const existingCertQuery = adminDb.collection("certificates").where("userId", "==", userId)
    const existingCertSnapshot = await existingCertQuery.get()

    let isUpdatingExisting = false
    let existingCertDocId = null

    if (!existingCertSnapshot.empty) {
      isUpdatingExisting = true
      existingCertDocId = existingCertSnapshot.docs[0].id
      console.log("📋 Existing certificate found, will update with latest external API data")
    }

    // Set issue date and expiry date (1 year from now)
    const issueDate = new Date()
    const expiryDate = new Date(issueDate)
    expiryDate.setFullYear(issueDate.getFullYear() + 1)
    expiryDate.setDate(expiryDate.getDate() + 1)

    // Get certificate details from external API first to get the certificate ID
    console.log("=== CERTIFICATE API - POST REQUEST ===");
    console.log("User ID:", userId);
    console.log("User Progress Data:", {
      name: progress?.name,
      email: progress?.email,
      finalTestScore: progress?.finalTestScore,
      finalTestGrade: progress?.finalTestGrade
    });
    
    // Generate encryption parameters once to ensure consistency
    let encryptionParams: any = null;
    let certificateDetails: any = null;
    let usingFallback = false;
    
    try {
      console.log("🔄 Generating encryption parameters...");
      encryptionParams = await generateCertificateEncryption(
        progress?.name || "",
        userId,
        progress?.email || "",
        progress?.finalTestScore?.toString() || "0",
        progress?.finalTestGrade || "F",
        issueDate.toISOString()
      );
      
      console.log("🔐 Encryption parameters generated:", {
        ciphertextHex: encryptionParams.ciphertextHex.substring(0, 20) + "...",
        ivHex: encryptionParams.ivHex,
        tagHex: encryptionParams.tagHex.substring(0, 20) + "..."
      });
      
      console.log("🔄 Calling external API for certificate details...");
      certificateDetails = await getCertificateDetailsFromEncryption(
        encryptionParams.ciphertextHex,
        encryptionParams.ivHex,
        encryptionParams.tagHex
      );
      
      console.log("✅ EXTERNAL API CERTIFICATE DETAILS RESPONSE:");
      console.log("📋 Full Response:", JSON.stringify(certificateDetails, null, 2));
      console.log("🆔 Certificate Number:", certificateDetails?.certificate_no_);
      console.log("📅 Completion Date:", certificateDetails?.completion_date_);
      console.log("👤 Name:", certificateDetails?.name_);
      console.log("📧 Email:", certificateDetails?.email_);
      console.log("📊 Grade:", certificateDetails?.grade_);
      console.log("📈 Percent:", certificateDetails?.percent_);
      console.log("🔑 UID:", certificateDetails?.uid_);
      console.log("⏰ Valid Until:", certificateDetails?.valid_upto_);
    } catch (apiError) {
      console.error("❌ Error with external API, using fallback:", apiError);
      usingFallback = true;
      
      // Fallback: Generate certificate with local data if external API fails
      console.log("🔄 External API failed, generating certificate with local data as fallback");
      
      const fallbackCertificateId = `CSG-${Date.now().toString(36).toUpperCase()}-${userId.substring(0, 8)}`;
      
      console.log("🆔 Fallback Certificate ID:", fallbackCertificateId);
      
      // Use fallback certificate ID and local data
      certificateDetails = {
        certificate_no_: fallbackCertificateId,
        completion_date_: issueDate.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        }),
        email_: progress?.email || "",
        grade_: progress?.finalTestGrade || "F",
        name_: progress?.name || "",
        percent_: progress?.finalTestScore?.toString() || "0",
        uid_: userId,
        valid_upto_: expiryDate.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })
      };
      
      console.log("✅ FALLBACK CERTIFICATE DETAILS:");
      console.log("📋 Fallback Response:", JSON.stringify(certificateDetails, null, 2));
      
      // Clear encryption params since external API failed
      encryptionParams = null;
    }

    // Use certificate ID from external API response
    const certificateId = certificateDetails?.certificate_no_ || `CSG-${userId.substring(0, 8)}`

    // Generate certificate URLs using the same encryption parameters (if available)
    let certificatePreviewURL = `#preview-unavailable-${certificateId}`;
    let certificateDownloadURL = `#download-unavailable-${certificateId}`;
    
    if (encryptionParams) {
      certificatePreviewURL = generateCertificateURLFromEncryption(
        encryptionParams.ciphertextHex,
        encryptionParams.ivHex,
        encryptionParams.tagHex,
        false // preview
      );
      
      certificateDownloadURL = generateCertificateURLFromEncryption(
        encryptionParams.ciphertextHex,
        encryptionParams.ivHex,
        encryptionParams.tagHex,
        true // download
      );
    }

    console.log("🔗 Certificate URLs generated:");
    console.log("👁️ Preview URL:", certificatePreviewURL);
    console.log("⬇️ Download URL:", certificateDownloadURL);

    // Create certificate data with details from external API
    const certificate: Certificate = {
      certificateId,
      userId,
      email: certificateDetails?.email_ || progress?.email || "",
      name: certificateDetails?.name_ || progress?.name || "",
      issueDate: issueDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      isValid: true,
      // Store encryption parameters for consistent URL generation
      encryptionParams: encryptionParams ? {
        ciphertextHex: encryptionParams.ciphertextHex,
        ivHex: encryptionParams.ivHex,
        tagHex: encryptionParams.tagHex
      } : null
    }

    // Store certificate in Firestore
    try {
      if (isUpdatingExisting && existingCertDocId) {
        // Delete old certificate document if certificate ID changed
        if (existingCertDocId !== certificateId) {
          await adminDb.collection("certificates").doc(existingCertDocId).delete()
          console.log("🗑️ Deleted old certificate document:", existingCertDocId)
        }
        await adminDb.collection("certificates").doc(certificateId).set(certificate)
        console.log("🔄 Updated existing certificate with new external API data")
      } else {
        await adminDb.collection("certificates").doc(certificateId).set(certificate)
        console.log("✨ Created new certificate")
      }
    } catch (dbError) {
      console.error("⚠️ Database error (certificate still generated):", dbError)
      // Continue execution - certificate data is still valid even if DB save fails
    }

    return NextResponse.json({
      success: true,
      message: isUpdatingExisting ? "Certificate updated successfully" : "Certificate generated successfully",
      certificate,
      certificatePreviewURL,
      certificateDownloadURL,
      isUpdate: isUpdatingExisting,
      usingFallback: usingFallback,
      apiStatus: usingFallback ? "external_api_failed_fallback_used" : "external_api_success"
    })
  } catch (error) {
    console.error("Error generating certificate:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate certificate"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// PUT: Get certificate details from external API
export async function PUT(request: NextRequest) {
  try {
    const { name, userId, email, percent, grade, issueDate } = await request.json()

    if (!name || !userId || !email || !percent || !grade || !issueDate) {
      return NextResponse.json({ 
        error: "Missing required fields: name, userId, email, percent, grade, issueDate" 
      }, { status: 400 })
    }

    console.log("=== CERTIFICATE API - PUT REQUEST ===");
    console.log("📝 Input Parameters:", { name, userId, email, percent, grade, issueDate });

    // Generate encryption parameters once to ensure consistency
    console.log("🔄 Generating encryption parameters...");
    const encryptionParams = await generateCertificateEncryption(
      name,
      userId,
      email,
      percent,
      grade,
      issueDate
    );
    
    console.log("🔐 Encryption parameters generated:", {
      ciphertextHex: encryptionParams.ciphertextHex.substring(0, 20) + "...",
      ivHex: encryptionParams.ivHex,
      tagHex: encryptionParams.tagHex.substring(0, 20) + "..."
    });

    // Get certificate details from external API using same encryption parameters
    console.log("🔄 Calling external API for certificate details...");
    const certificateDetails = await getCertificateDetailsFromEncryption(
      encryptionParams.ciphertextHex,
      encryptionParams.ivHex,
      encryptionParams.tagHex
    );

    // Generate certificate URLs using the same encryption parameters
    const certificatePreviewURL = generateCertificateURLFromEncryption(
      encryptionParams.ciphertextHex,
      encryptionParams.ivHex,
      encryptionParams.tagHex,
      false // preview
    );
    
    const certificateDownloadURL = generateCertificateURLFromEncryption(
      encryptionParams.ciphertextHex,
      encryptionParams.ivHex,
      encryptionParams.tagHex,
      true // download
    );

    console.log("✅ EXTERNAL API CERTIFICATE DETAILS RESPONSE:");
    console.log("📋 Full Response:", JSON.stringify(certificateDetails, null, 2));
    console.log("🆔 Certificate Number:", certificateDetails?.certificate_no_);
    console.log("📅 Completion Date:", certificateDetails?.completion_date_);
    console.log("👤 Name:", certificateDetails?.name_);
    console.log("📧 Email:", certificateDetails?.email_);
    console.log("📊 Grade:", certificateDetails?.grade_);
    console.log("📈 Percent:", certificateDetails?.percent_);
    console.log("🔑 UID:", certificateDetails?.uid_);
    console.log("⏰ Valid Until:", certificateDetails?.valid_upto_);
    console.log("🔗 Certificate URLs generated:");
    console.log("👁️ Preview URL:", certificatePreviewURL);
    console.log("⬇️ Download URL:", certificateDownloadURL);

    return NextResponse.json({
      success: true,
      message: "Certificate details retrieved successfully",
      certificateDetails,
      certificatePreviewURL,
      certificateDownloadURL,
      encryptionParams: {
        ciphertextHex: encryptionParams.ciphertextHex,
        ivHex: encryptionParams.ivHex,
        tagHex: encryptionParams.tagHex
      }
    })
  } catch (error) {
    console.error("❌ Error getting certificate details:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to get certificate details"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}