// Helper function to set a cookie
export function setCookie(name: string, value: string, days: number = 30) {
  if (typeof window === 'undefined') {
    return; // Don't attempt to set cookies on the server
  }
  
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  
  // Determine if we're in a secure context (HTTPS)
  const isSecure = window.location.protocol === 'https:';
  
  // Set the cookie with appropriate security settings
  // Use SameSite=None for cross-site requests, but only with Secure flag
  // For production environments, this ensures cookies work across domains/subdomains
  const secureFlag = isSecure ? "; Secure" : "";
  const sameSite = isSecure ? "; SameSite=None" : "; SameSite=Lax";
  
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/" + secureFlag + sameSite;
  
  // Always store in localStorage as a fallback
  try {
    localStorage.setItem(name, value);
  } catch (e) {
    console.error('Error storing in localStorage:', e);
  }
}

// Helper function to get a cookie
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') {
    return null; // Can't access cookies on the server
  }
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const encodedValue = c.substring(nameEQ.length, c.length);
      try {
        return decodeURIComponent(encodedValue);
      } catch (e) {
        // If decoding fails, return the raw value
        return encodedValue;
      }
    }
  }
  
  // If cookie not found in document.cookie, try localStorage as fallback
  try {
    const localValue = localStorage.getItem(name);
    return localValue;
  } catch (e) {
    console.error('Error accessing localStorage:', e);
  }
  
  return null;
}

// Helper function to delete a cookie
export function deleteCookie(name: string) {
  if (typeof window === 'undefined') {
    return; // Don't attempt to delete cookies on the server
  }
  
  document.cookie = name + '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
  
  // Also remove from localStorage if it exists there
  try {
    localStorage.removeItem(name);
  } catch (e) {
    console.error('Error accessing localStorage:', e);
  }
}