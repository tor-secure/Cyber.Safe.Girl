// Test script to verify session persistence and redirection
const puppeteer = require('puppeteer');

async function testSessionPersistence() {
  console.log('Starting session persistence test...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Step 1: Go to login page
    console.log('Step 1: Going to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Step 2: Login with test credentials
    console.log('Step 2: Logging in...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Logged in successfully, current URL:', page.url());
    
    // Step 3: Verify we're on the dashboard
    const isDashboard = page.url().includes('/dashboard');
    console.log('Step 3: Verify dashboard redirect:', isDashboard ? 'Success' : 'Failed');
    
    // Step 4: Go back to homepage
    console.log('Step 4: Going back to homepage...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    
    // Step 5: Check if redirected to dashboard (session maintained)
    await page.waitForTimeout(3000); // Wait for potential redirect
    const redirectedToDashboard = page.url().includes('/dashboard');
    console.log('Step 5: Verify homepage redirect to dashboard:', redirectedToDashboard ? 'Success' : 'Failed');
    
    // Step 6: Try login page again
    console.log('Step 6: Going to login page again...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Step 7: Check if redirected to dashboard (session maintained)
    await page.waitForTimeout(3000); // Wait for potential redirect
    const loginRedirectedToDashboard = page.url().includes('/dashboard');
    console.log('Step 7: Verify login page redirect to dashboard:', loginRedirectedToDashboard ? 'Success' : 'Failed');
    
    // Step 8: Logout test
    console.log('\nStep 8: Testing logout functionality...');
    // Navigate to dashboard where logout button is available
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    
    // Find and click the logout button
    console.log('Clicking logout button...');
    await page.evaluate(() => {
      // Find logout button by text content
      const logoutButtons = Array.from(document.querySelectorAll('button'))
        .filter(button => button.textContent.includes('Logout'));
      
      if (logoutButtons.length > 0) {
        logoutButtons[0].click();
        return true;
      }
      return false;
    });
    
    // Wait for redirect to login page with logout parameter
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('After logout, current URL:', page.url());
    
    // Step 9: Verify we're on login page with logout parameter
    const isLogoutPage = page.url().includes('/login?logout=true');
    console.log('Step 9: Verify logout redirect:', isLogoutPage ? 'Success' : 'Failed');
    
    // Step 10: Try to go to homepage after logout
    console.log('Step 10: Going to homepage after logout...');
    await page.goto('http://localhost:3000/homepage', { waitUntil: 'networkidle2' });
    
    // Step 11: Verify we stay on homepage (no redirect loop)
    await page.waitForTimeout(3000); // Wait to see if there's a redirect
    const staysOnHomepage = page.url().includes('/homepage');
    console.log('Step 11: Verify no redirect loop after logout:', staysOnHomepage ? 'Success' : 'Failed');
    
    // Summary
    console.log('\nTest Summary:');
    console.log('-------------');
    console.log('Initial login redirect to dashboard:', isDashboard ? 'PASSED' : 'FAILED');
    console.log('Homepage redirect when logged in:', redirectedToDashboard ? 'PASSED' : 'FAILED');
    console.log('Login page redirect when logged in:', loginRedirectedToDashboard ? 'PASSED' : 'FAILED');
    console.log('Logout redirect to login page:', isLogoutPage ? 'PASSED' : 'FAILED');
    console.log('No redirect loop after logout:', staysOnHomepage ? 'PASSED' : 'FAILED');
    
    if (isDashboard && redirectedToDashboard && loginRedirectedToDashboard && isLogoutPage && staysOnHomepage) {
      console.log('\nOVERALL TEST: PASSED ✅');
    } else {
      console.log('\nOVERALL TEST: FAILED ❌');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testSessionPersistence();