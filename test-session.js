// This script can be run in the browser console to test session persistence

function testSessionPersistence() {
  console.log('=== Session Persistence Test ===');
  
  // Check if we have auth tokens
  const authCookie = document.cookie.includes('firebase-auth-token');
  const localStorageToken = localStorage.getItem('firebase-auth-token');
  const sessionStorageToken = sessionStorage.getItem('firebase-auth-token');
  const storedUser = localStorage.getItem('user');
  
  console.log('Auth Cookie exists:', authCookie);
  console.log('LocalStorage Token exists:', !!localStorageToken);
  console.log('SessionStorage Token exists:', !!sessionStorageToken);
  console.log('Stored User exists:', !!storedUser);
  
  if (storedUser) {
    try {
      console.log('User data:', JSON.parse(storedUser));
    } catch (e) {
      console.log('Error parsing user data:', e);
    }
  }
  
  // Check current path
  console.log('Current path:', window.location.pathname);
  
  // Check if we should be redirected
  const publicAuthPaths = ['/', '/homepage', '/login', '/register'];
  if (publicAuthPaths.includes(window.location.pathname) && (authCookie || localStorageToken || sessionStorageToken)) {
    console.log('WARNING: You are on a public path but have auth tokens. You should be redirected to dashboard.');
  }
  
  // Check for redirect loop protection
  const redirectLoopProtection = sessionStorage.getItem('redirectLoopProtection');
  console.log('Redirect loop protection:', redirectLoopProtection);
  
  // Test navigation
  console.log('To test session persistence:');
  console.log('1. Log in to the application');
  console.log('2. After reaching dashboard, click browser back button');
  console.log('3. Try to access /login or / directly');
  console.log('4. You should be redirected to dashboard in all cases');
  
  console.log('=== End of Test ===');
}

// Run the test
testSessionPersistence();