// This script can be run in the browser console to test admin access protection

function testAdminAccess() {
  console.log('=== Admin Access Protection Test ===');
  
  // Check if we have auth tokens
  const authCookie = document.cookie.includes('firebase-auth-token');
  const localStorageToken = localStorage.getItem('firebase-auth-token');
  const sessionStorageToken = sessionStorage.getItem('firebase-auth-token');
  
  // Check if we have admin status
  const adminCookie = document.cookie.includes('is-admin=true');
  const localStorageAdmin = localStorage.getItem('is-admin') === 'true';
  
  console.log('Auth Cookie exists:', authCookie);
  console.log('LocalStorage Token exists:', !!localStorageToken);
  console.log('SessionStorage Token exists:', !!sessionStorageToken);
  console.log('Admin Cookie exists:', adminCookie);
  console.log('LocalStorage Admin status:', localStorageAdmin);
  
  // Check current path
  console.log('Current path:', window.location.pathname);
  
  // Check if we're on an admin route without admin privileges
  const isAdminRoute = window.location.pathname.startsWith('/admin') && 
                      window.location.pathname !== '/admin/login';
  
  if (isAdminRoute && !adminCookie && !localStorageAdmin) {
    console.log('WARNING: You are on an admin route but do not have admin privileges.');
    console.log('You should be redirected to the admin login page.');
  }
  
  // Test instructions
  console.log('\nTo test admin access protection:');
  console.log('1. Log in as a regular user (non-admin)');
  console.log('2. Try to access /admin/dashboard directly in the URL');
  console.log('3. You should be redirected to /admin/login');
  console.log('4. Log in as an admin user');
  console.log('5. You should be able to access all admin routes');
  
  console.log('=== End of Test ===');
}

// Run the test
testAdminAccess();