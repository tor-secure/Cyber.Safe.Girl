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
 * Fetch certificate ID from external API with retry logic
 */
export async function fetchCertificateIdFromAPI(
  name: string,
  userId: string,
  email: string,
  percent: string,
  grade: string,
  issueDate: string,
  maxRetries: number = 3
): Promise<{
  certificateId: string;
  encryptionParams: {
    ciphertextHex: string;
    ivHex: string;
    tagHex: string;
  };
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
  
  // Use the dedicated function to get certificate details
  const certificateDetails = await getCertificateDetailsFromAPI(
    ciphertextHex,
    ivHex,
    tagHex,
    maxRetries
  );
  
  console.log(`Successfully fetched certificate ID: ${certificateDetails.certificate_no_}`);
  
  return {
    certificateId: certificateDetails.certificate_no_,
    encryptionParams: {
      ciphertextHex,
      ivHex,
      tagHex
    }
  };
}

/**
 * Generate encryption parameters for certificate data
 */
export async function generateEncryptionParams(
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
}> {
  const dataString = generateCertificateDataString(
    name,
    userId,
    email,
    percent,
    grade,
    issueDate
  );
  
  return await encryptAES128GCM(dataString);
}

/**
 * Get certificate details from external API using encryption parameters
 */
export async function getCertificateDetailsFromAPI(
  ciphertextHex: string,
  ivHex: string,
  tagHex: string,
  maxRetries: number = 3
): Promise<{
  certificate_no_: string;
  completion_date_: string;
  email_: string;
  grade_: string;
  name_: string;
  percent_: string;
  uid_: string;
  valid_upto_: string;
}> {
  const apiUrl = `https://api-certicore.vercel.app/certified?param_ct_=${ciphertextHex}&param_iv_=${ivHex}&param_at_=${tagHex}&download_=request_is_false&certificate_details_=request_is_true`;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to fetch certificate details from external API (attempt ${attempt}/${maxRetries})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'curl/7.68.0',
          'Accept': '*/*',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`External API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.certificate_no_) {
        throw new Error("Certificate details not found in external API response");
      }
      
      console.log(`Successfully fetched certificate details: ${data.certificate_no_}`);
      
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error("All attempts to fetch certificate details from external API failed:", lastError);
  throw new Error(`Failed to fetch certificate details from external API after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Generate certificate URL for preview or download using stored encryption params
 */
export function generateCertificateURLWithParams(
  ciphertextHex: string,
  ivHex: string,
  tagHex: string,
  isDownload: boolean = false
): string {
  const downloadParam = isDownload ? "request_is_true" : "request_is_false";
  return `https://api-certicore.vercel.app/certified?param_ct_=${ciphertextHex}&param_iv_=${ivHex}&param_at_=${tagHex}&download_=${downloadParam}&certificate_details_=request_is_false`;
}

/**
 * Get certificate details using stored encryption parameters
 * This function is useful when you have encryption parameters and need to fetch certificate details
 */
export async function getCertificateDetailsWithStoredParams(
  encryptionParams: {
    ciphertextHex: string;
    ivHex: string;
    tagHex: string;
  },
  maxRetries: number = 3
): Promise<{
  certificate_no_: string;
  completion_date_: string;
  email_: string;
  grade_: string;
  name_: string;
  percent_: string;
  uid_: string;
  valid_upto_: string;
}> {
  return await getCertificateDetailsFromAPI(
    encryptionParams.ciphertextHex,
    encryptionParams.ivHex,
    encryptionParams.tagHex,
    maxRetries
  );
}

/**
 * Generate certificate URL for preview or download (legacy function for backward compatibility)
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
  
  const downloadParam = isDownload ? "request_is_true" : "request_is_false";
  // &download_=request_is_true&certificate_details_=request_is_true
  return `https://api-certicore.vercel.app/certified?param_ct_=${ciphertextHex}&param_iv_=${ivHex}&param_at_=${tagHex}&download_=${downloadParam}&certificate_details_=request_is_false`;
}
