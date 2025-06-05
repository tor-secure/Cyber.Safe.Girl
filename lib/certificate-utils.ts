// Load constants from environment variables
const INITIALIZATION_VECTOR = process.env.NEXT_PUBLIC_INITIALIZATION_VECTOR || "";
const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY || "";

// Validate that the constants are loaded
if (!INITIALIZATION_VECTOR || !SECRET_KEY) {
  throw new Error("Missing encryption constants in environment variables.");
}

/**
 * Convert ArrayBuffer or Uint8Array to hex string
 */
function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Convert ASCII string to Uint8Array
 */
function asciiToBytes(str: string): Uint8Array {
  return new Uint8Array([...str].map(char => char.charCodeAt(0)));
}

/**
 * Encrypt data using AES-128-GCM
 */
export async function encryptAES128GCM(plaintext: string): Promise<{
  ivHex: string;
  ciphertextHex: string;
  tagHex: string;
}> {
  const encoder = new TextEncoder();

  const keyBytes = asciiToBytes(SECRET_KEY); // 16 bytes for AES-128
  const ivBytes = asciiToBytes(INITIALIZATION_VECTOR); // 16 bytes for IV

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
      tagLength: 128, // Tag is 16 bytes (default)
    },
    key,
    encoder.encode(plaintext)
  );

  // Convert ArrayBuffer to Uint8Array
  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const tagLengthBytes = 16;

  // Use slice method as in the reference implementation
  const ciphertextBytes = encryptedBytes.slice(0, -tagLengthBytes);
  const tagBytes = encryptedBytes.slice(-tagLengthBytes);

  return {
    ivHex: toHex(ivBytes),
    ciphertextHex: toHex(ciphertextBytes),
    tagHex: toHex(tagBytes),
  };
}

/**
 * Generate certificate data string for encryption
 * Format: "Name;UserId;Email;Percentage;Grade;issueDate"
 * Example: "Ashwin Pramod Bekal;r3657gvtfygukguyh8h88h;ashwin.cy21@sahyadri.edu.in;97;A+;21 May 2025"
 * 
 * Note: UserId should be the Firebase user ID (UID) generated when an account is created
 * Note: Date format should be "DD Month YYYY" (e.g., "21 May 2025")
 */
/**
 * Format ISO date string to "DD Month YYYY"
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Generate certificate data string for encryption
 */
export function generateCertificateDataString(
  name: string,
  userId: string,
  email: string,
  percent: string,
  grade: string,
  issueDate: string
): string {
  // Always format the date to "DD Month YYYY"
  const formattedDate = formatDate(issueDate);

  return `${name};${userId};${email};${percent};${grade};${formattedDate}`;
}


/**
 * Generate encryption parameters for certificate data
 * This ensures consistent encryption across different function calls
 */
export async function generateCertificateEncryption(
  name: string,
  userId: string,
  email: string,
  percent: string,
  grade: string,
  issueDate: string
): Promise<{
  ciphertextHex: string;
  ivHex: string;
  tagHex: string;
  dataString: string;
}> {
  const dataString = generateCertificateDataString(
    name,
    userId,
    email,
    percent,
    grade,
    issueDate
  );
  
  console.log("Certificate data string:", dataString);
  
  const { ciphertextHex, ivHex, tagHex } = await encryptAES128GCM(dataString);
  
  return {
    ciphertextHex,
    ivHex,
    tagHex,
    dataString
  };
}

/**
 * Generate certificate URL for preview or download using provided encryption parameters
 */
export function generateCertificateURLFromEncryption(
  ciphertextHex: string,
  ivHex: string,
  tagHex: string,
  isDownload: boolean = false
): string {
  const downloadParam = isDownload ? "request_is_true" : "request_is_false";
  return `https://api-certicore.vercel.app/certified?param_ct_=${ciphertextHex}&param_iv_=${ivHex}&param_at_=${tagHex}&download_=${downloadParam}&certificate_details_=request_is_false`;
}

/**
 * Generate certificate URL for preview or download
 */
export async function generateCertificateURL(
  name: string,
  userId: string,
  email: string,
  percent: string,
  grade: string,
  issueDate: string,
  isDownload: boolean = false
): Promise<string> {
  const { ciphertextHex, ivHex, tagHex } = await generateCertificateEncryption(
    name,
    userId,
    email,
    percent,
    grade,
    issueDate
  );
  
  return generateCertificateURLFromEncryption(ciphertextHex, ivHex, tagHex, isDownload);
}

/**
 * Test basic connectivity to the external API
 */
async function testApiConnectivity(): Promise<boolean> {
  try {
    console.log("🔍 Testing API connectivity...");
    const response = await fetch("https://api-certicore.vercel.app/", {
      method: 'HEAD',
      headers: {
        'User-Agent': 'curl/7.88.1',
      }
    });
    console.log(`✅ API connectivity test: ${response.status}`);
    return true;
  } catch (error) {
    console.error("❌ API connectivity test failed:", error);
    return false;
  }
}

/**
 * Get certificate details from the API using provided encryption parameters
 */
export async function getCertificateDetailsFromEncryption(
  ciphertextHex: string,
  ivHex: string,
  tagHex: string
): Promise<any> {
  try {
    // Test connectivity first
    await testApiConnectivity();
    
    const apiUrl = `https://api-certicore.vercel.app/certified?param_ct_=${ciphertextHex}&param_iv_=${ivHex}&param_at_=${tagHex}&download_=request_is_false&certificate_details_=request_is_true`;
    
    console.log("Fetching certificate details from:", apiUrl);
    console.log("🌐 Starting fetch request...");
    
    // Add timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("⏰ Fetch timeout reached, aborting request");
      controller.abort();
    }, 20000); // Increased to 20 second timeout
    
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'curl/7.88.1',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      }
    });
    
    const endTime = Date.now();
    console.log(`🚀 Fetch completed in ${endTime - startTime}ms`);
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const certificateDetails = await response.json();
    
    console.log("Certificate details received:", certificateDetails);
    
    return certificateDetails;
  } catch (error) {
    console.error("Error fetching certificate details:", error);
    
    // Check if it's a timeout error
    if (
      typeof error === 'object' &&
      error !== null &&
      ('name' in error || 'code' in error)
    ) {
      const err = error as { name?: string; code?: string };
      if (err.name === 'AbortError' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
        console.error("⏰ External API timeout - API is not responding");
        throw new Error("External certificate API is currently unavailable (timeout). Please try again later.");
      }
    }
    
    throw error;
  }
}

/**
 * Get certificate details from the API
 */
export async function getCertificateDetails(
  name: string,
  userId: string,
  email: string,
  percent: string,
  grade: string,
  issueDate: string
): Promise<any> {
  try {
    const { ciphertextHex, ivHex, tagHex } = await generateCertificateEncryption(
      name,
      userId,
      email,
      percent,
      grade,
      issueDate
    );
    
    return await getCertificateDetailsFromEncryption(ciphertextHex, ivHex, tagHex);
  } catch (error) {
    console.error("Error fetching certificate details:", error);
    throw error;
  }
}

/**
 * Generate certificate URLs using stored encryption parameters from a certificate object
 */
export function generateCertificateURLsFromStoredParams(
  certificate: {
    encryptionParams?: {
      ciphertextHex: string;
      ivHex: string;
      tagHex: string;
    } | null;
  }
): {
  previewUrl: string;
  downloadUrl: string;
} {
  if (!certificate.encryptionParams) {
    return {
      previewUrl: "#preview-unavailable-no-encryption-params",
      downloadUrl: "#download-unavailable-no-encryption-params"
    };
  }

  const { ciphertextHex, ivHex, tagHex } = certificate.encryptionParams;
  
  return {
    previewUrl: generateCertificateURLFromEncryption(ciphertextHex, ivHex, tagHex, false),
    downloadUrl: generateCertificateURLFromEncryption(ciphertextHex, ivHex, tagHex, true)
  };
}