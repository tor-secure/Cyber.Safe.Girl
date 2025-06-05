import { type NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getCertificateDetailsWithStoredParams, generateEncryptionParams } from "@/lib/certificate-utils";

interface Certificate {
  certificateId: string;
  userId: string;
  email: string;
  name: string;
  issueDate: string;
  expiryDate: string;
  isValid: boolean;
  encryptionParams?: {
    ciphertextHex: string;
    ivHex: string;
    tagHex: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get("certificateId");
    const userId = searchParams.get("userId");

    if (!certificateId) {
      return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 });
    }

    // Check database connection
    if (!adminDb) {
      console.error("Firebase Admin not initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Get certificate from database
    const certificateDoc = await adminDb.collection("certificates").doc(certificateId).get();
    
    if (!certificateDoc.exists) {
      return NextResponse.json({
        error: "Certificate not found",
        message: "No certificate found with the provided ID"
      }, { status: 404 });
    }

    const certificateData = certificateDoc.data() as Certificate;

    // Verify user ownership if userId is provided
    if (userId && certificateData.userId !== userId) {
      return NextResponse.json({
        error: "Unauthorized",
        message: "You don't have permission to access this certificate"
      }, { status: 403 });
    }

    // Check if certificate has encryption parameters
    if (!certificateData.encryptionParams) {
      return NextResponse.json({
        error: "Certificate details unavailable",
        message: "This certificate doesn't have encryption parameters stored",
        certificate: certificateData
      }, { status: 200 });
    }

    try {
      // Get certificate details from external API using stored encryption parameters
      const externalDetails = await getCertificateDetailsWithStoredParams(
        certificateData.encryptionParams
      );

      return NextResponse.json({
        success: true,
        certificate: certificateData,
        externalDetails: externalDetails,
        message: "Certificate details retrieved successfully"
      });

    } catch (apiError) {
      console.error("Failed to fetch certificate details from external API:", apiError);
      
      // Return certificate data without external details if API fails
      return NextResponse.json({
        success: true,
        certificate: certificateData,
        externalDetails: null,
        message: "Certificate found but external details unavailable",
        warning: "External API is currently unavailable"
      });
    }

  } catch (error) {
    console.error("Error fetching certificate details:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch certificate details";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { certificateId, userId, forceRefresh } = await request.json();

    if (!certificateId) {
      return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 });
    }

    // Check database connection
    if (!adminDb) {
      console.error("Firebase Admin not initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Get certificate from database
    const certificateDoc = await adminDb.collection("certificates").doc(certificateId).get();
    
    if (!certificateDoc.exists) {
      return NextResponse.json({
        error: "Certificate not found",
        message: "No certificate found with the provided ID"
      }, { status: 404 });
    }

    const certificateData = certificateDoc.data() as Certificate;

    // Verify user ownership if userId is provided
    if (userId && certificateData.userId !== userId) {
      return NextResponse.json({
        error: "Unauthorized",
        message: "You don't have permission to access this certificate"
      }, { status: 403 });
    }

    let encryptionParams = certificateData.encryptionParams;

    // Generate encryption parameters if not available or force refresh is requested
    if (!encryptionParams || forceRefresh) {
      try {
        // Get user progress to calculate percentage and grade
        const userProgressDoc = await adminDb.collection("userProgress").doc(certificateData.userId).get();
        
        if (!userProgressDoc.exists) {
          return NextResponse.json({ error: "User progress not found" }, { status: 404 });
        }

        const progress = userProgressDoc.data();
        const percentage = progress?.finalTestScore && progress?.finalTestTotalQuestions
          ? Math.round((progress.finalTestScore / progress.finalTestTotalQuestions) * 100).toString()
          : "100";

        const grade = percentage >= "90" ? "A+" : percentage >= "80" ? "A" : percentage >= "70" ? "B+" : percentage >= "60" ? "B" : "C";

        // Generate new encryption parameters
        encryptionParams = await generateEncryptionParams(
          certificateData.name,
          certificateData.userId,
          certificateData.email,
          percentage,
          grade,
          certificateData.issueDate
        );

        // Update certificate with new encryption parameters
        await adminDb.collection("certificates").doc(certificateId).update({
          encryptionParams
        });

        console.log("Generated and stored new encryption parameters for certificate:", certificateId);

      } catch (encryptError) {
        console.error("Failed to generate encryption parameters:", encryptError);
        return NextResponse.json({
          error: "Failed to generate encryption parameters",
          message: encryptError instanceof Error ? encryptError.message : "Unknown error"
        }, { status: 500 });
      }
    }

    try {
      // Get certificate details from external API
      const externalDetails = await getCertificateDetailsWithStoredParams(encryptionParams);

      return NextResponse.json({
        success: true,
        certificate: {
          ...certificateData,
          encryptionParams
        },
        externalDetails: externalDetails,
        message: "Certificate details retrieved successfully"
      });

    } catch (apiError) {
      console.error("Failed to fetch certificate details from external API:", apiError);
      
      return NextResponse.json({
        success: true,
        certificate: {
          ...certificateData,
          encryptionParams
        },
        externalDetails: null,
        message: "Certificate found but external details unavailable",
        warning: "External API is currently unavailable"
      });
    }

  } catch (error) {
    console.error("Error processing certificate details request:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}