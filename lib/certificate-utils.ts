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
 * Format: "Name;CertificateID;Email;Percentage;Grade;issueDate"
 * Example: "Ashwin Pramod Bekal;CSG7-USER71903768;ashwin.cy21@sahyadri.edu.in;97;A+;21 May 2025"
 * 
 * Note: CertificateID should be in format CSG7-USERxxxxxxxx
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
  certificateId: string,
  email: string,
  percent: string,
  grade: string,
  issueDate: string
): string {
  // Always format the date to "DD Month YYYY"
  const formattedDate = formatDate(issueDate);

  return `${name};${certificateId};${email};${percent};${grade};${formattedDate}`;
}


/**
 * Generate certificate URL for preview or download
 */
export async function generateCertificateURL(
  name: string,
  certificateId: string,
  email: string,
  percent: string,
  grade: string,
  issueDate: string,
  isDownload: boolean = false
): Promise<string> {
  const dataString = generateCertificateDataString(
    name,
    certificateId,
    email,
    percent,
    grade,
    issueDate
  );
  
  console.log("Certificate data string:", dataString);
  
  const { ciphertextHex, ivHex, tagHex } = await encryptAES128GCM(dataString);
  
  const downloadParam = isDownload ? "request_is_true" : "request_is_false";
  
  return `https://api-certicore.vercel.app/certified?param_ct_=${ciphertextHex}&param_iv_=${ivHex}&param_at_=${tagHex}&download_=${downloadParam}`;
}