const fs = require('fs');
const path = require('path');

const filePath = path.join('/workspace/CSG/lib/auth-context.tsx');
const fileContent = fs.readFileSync(filePath, 'utf8');

const oldStr = `        // Store token in a cookie that persists across sessions
        setCookie('firebase-auth-token', token, 30); // 30 days
        
        // Also store in localStorage as a backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('firebase-auth-token', token);
        }`;

const newStr = `        // Store token in multiple places for redundancy
        setCookie('firebase-auth-token', token, 30); // 30 days
        
        // Also store in localStorage and sessionStorage as a backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('firebase-auth-token', token);
          sessionStorage.setItem('firebase-auth-token', token);
          
          // Set a custom attribute on document for debugging
          try {
            (document as any).firebaseAuthToken = token.substring(0, 10) + '...';
          } catch (e) {
            console.warn('Could not set debug token attribute');
          }
        }`;

const updatedContent = fileContent.replace(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);

fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('File updated successfully');
