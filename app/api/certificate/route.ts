import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { fetchCertificateIdFromAPI, getCertificateDetailsWithStoredParams } from "@/lib/certificate-utils"

// Define the structure for certificate data
interface Certificate {
  certificateId: string
  userId: string
  email: string
  name: string
  issueDate: string
  expiryDate: string
  isValid: boolean
  finalTestScore?: number
  finalTestTotalQuestions?: number
  grade?: string
  percentage?: string
  encryptionParams?: {
    ciphertextHex: string
    ivHex: string
    tagHex: string
  }
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
    const existingCertQuery = adminDb.collection("certificates").where("userId", "==", userId);
    const existingCertSnapshot = await existingCertQuery.get();

    // If certificate already exists, check if it needs to be updated
    if (!existingCertSnapshot.empty) {
      const existingCert = existingCertSnapshot.docs[0].data() as Certificate;
      
      // Calculate current percentage and grade from latest final test score
      const currentPercentage = progress?.finalTestScore && progress?.finalTestTotalQuestions
        ? Math.round((progress.finalTestScore / progress.finalTestTotalQuestions) * 100).toString()
        : "100";

      const currentGrade = currentPercentage >= "90" ? "A+" : currentPercentage >= "80" ? "A" : currentPercentage >= "70" ? "B+" : currentPercentage >= "60" ? "B" : "C";

      // Check if we need to update the certificate due to:
      // 1. Missing encryption params or CSG- prefix (legacy certificates)
      // 2. Score improvement since the certificate was issued
      const hasScoreImprovement = progress?.finalTestScore && progress?.finalTestTotalQuestions &&
                                 existingCert.finalTestScore !== undefined &&
                                 progress.finalTestScore > existingCert.finalTestScore;
      
      const needsUpdate = !existingCert.encryptionParams || 
                         existingCert.certificateId.startsWith("CSG-") ||
                         hasScoreImprovement ||
                         // Also update if certificate doesn't have score data stored
                         (existingCert.finalTestScore === undefined && progress?.finalTestScore);

      if (needsUpdate) {
        try {
          // Try to fetch certificate ID from external API with current score
          try {
            const { certificateId: externalCertId, encryptionParams } = await fetchCertificateIdFromAPI(
              existingCert.name,
              existingCert.userId,
              existingCert.email,
              currentPercentage,
              currentGrade,
              existingCert.issueDate
            );

            // Update the certificate with external API data and current score
            const updatedCertificate: Certificate = {
              ...existingCert,
              certificateId: externalCertId,
              encryptionParams,
              finalTestScore: progress?.finalTestScore,
              finalTestTotalQuestions: progress?.finalTestTotalQuestions,
              grade: currentGrade,
              percentage: currentPercentage
            };

            // Update in Firestore - delete old document and create new one with external certificate ID
            await adminDb.collection("certificates").doc(existingCert.certificateId).delete();
            await adminDb.collection("certificates").doc(externalCertId).set(updatedCertificate);

            return NextResponse.json({ 
              message: "Certificate updated with latest final test score",
              certificate: updatedCertificate
            });
          } catch (apiError) {
            console.error("Failed to update certificate with external API, keeping existing certificate:", apiError);
            // If external API fails, just return the existing certificate
            return NextResponse.json({ 
              message: "Certificate already exists (external API unavailable)",
              certificate: existingCert
            });
          }
        } catch (error) {
          console.error("Failed to update certificate with external API:", error);
          // Return existing certificate if external API fails
          return NextResponse.json({ 
            message: "Certificate already exists",
            certificate: existingCert
          });
        }
      }

      return NextResponse.json({ 
        message: "Certificate already exists",
        certificate: existingCert
      });
    }

    // Set issue date and expiry date (1 year from now)
    const issueDate = new Date();
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(issueDate.getFullYear() + 1);
    expiryDate.setDate(expiryDate.getDate() + 1);

    // Calculate percentage and grade
    const percentage = progress?.finalTestScore && progress?.finalTestTotalQuestions
      ? Math.round((progress.finalTestScore / progress.finalTestTotalQuestions) * 100).toString()
      : "100";

    const grade = percentage >= "90" ? "A+" : percentage >= "80" ? "A" : percentage >= "70" ? "B+" : percentage >= "60" ? "B" : "C";

    // Try to fetch certificate ID from external API
    let certificateId: string;
    let encryptionParams: { ciphertextHex: string; ivHex: string; tagHex: string } | undefined;
    
    try {
      const apiResult = await fetchCertificateIdFromAPI(
        progress?.name || "",
        userId,
        progress?.email || "",
        percentage,
        grade,
        issueDate.toISOString()
      );
      certificateId = apiResult.certificateId;
      encryptionParams = apiResult.encryptionParams;
      console.log("Successfully fetched certificate ID from external API:", certificateId);
    } catch (error) {
      console.error("External API failed:", error);
      return NextResponse.json({
        error: "Certificate generation temporarily unavailable",
        message: "External certificate service is currently not available. Please try again later.",
        details: "The external API for certificate generation is not responding."
      }, { status: 503 });
    }

    // Create certificate data
    const certificate: Certificate = {
      certificateId,
      userId,
      email: progress?.email || "",
      name: progress?.name || "",
      issueDate: issueDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      isValid: true,
      finalTestScore: progress?.finalTestScore,
      finalTestTotalQuestions: progress?.finalTestTotalQuestions,
      grade: grade,
      percentage: percentage,
      ...(encryptionParams && { encryptionParams })
    };

    // Store certificate in Firestore using external certificate ID as document ID
    await adminDb.collection("certificates").doc(certificateId).set(certificate);

    return NextResponse.json({
      success: true,
      message: "Certificate generated successfully",
      certificate
    });
  } catch (error) {
    console.error("Error generating certificate:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate certificate";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Remove certificate to allow regeneration with updated scores
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("Certificate API DELETE - User ID:", userId)

    if (!adminDb) {
      console.error("Firebase admin is not initialized")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Find and delete existing certificate
    const existingCertQuery = adminDb.collection("certificates").where("userId", "==", userId);
    const existingCertSnapshot = await existingCertQuery.get();

    if (existingCertSnapshot.empty) {
      return NextResponse.json({ 
        message: "No certificate found for this user" 
      }, { status: 404 })
    }

    // Delete the certificate
    const existingCert = existingCertSnapshot.docs[0];
    await adminDb.collection("certificates").doc(existingCert.id).delete();

    return NextResponse.json({
      success: true,
      message: "Certificate deleted successfully. You can now generate a new certificate with updated scores."
    });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete certificate";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
