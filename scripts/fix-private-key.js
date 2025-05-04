// Script to fix the private key format
const fs = require('fs');

// The raw private key
const rawPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDtHijELubLAalL
ZIjn1vkfNB7hZezWdHRyu6xvGpIDpSY8wyO82tn3auWxVzo6dKmyLfNnl5VA+/H3
+VoAs2TR0IhcnLvmqAPOIuw2mClAFmfrOkPXV+VoiErdeK9PqHo80UdGEZcuh10G
deMRWUIbg/9IJzavgrUUmk/ipiC8tGzbeTsvZwlykBsnMQmdgdDPEISZSHPUBNLH
LZmZ6EBWHtS7eQtCZdiHBoKDecBdAh7lh3lxWBXtDxa4ITY07TmxSoQuDkOmYIGi
E5trLGnBIrkqAw33H6mJeDx77d8qoupsqZOIIlpDNcjJeBHlpTL/Dr/BC2afkdqq
eL60OY7HAgMBAAECggEAIc+YHolVjYL6Ie7++pgTw9hJwvgmslm+tRF/wAP46B4n
eqiUsvw98mLCx+vZOLaj7+1PdOkPdkm2shZTOCBccvKaTyJmRLiWelFOf2ZpE2Ne
hBM100IMS0CL9FKeJOywKXXqBNrDRPY2VJKAw1uH6qaCw0YcLSClM3/hfj8UEfQe
Ad7Ws1VcKvJc4VGqugF8olya/isV8ETdWvGtBcqj06BHyQYSZB47Yt63E9zYSkA5
pFjdY7gSVkHcAaEZeURUR2Y02RFktsbFClgdGX7tPPOoOlksf+wQKWTw+H3Qc7l2
/49QhngLlTwMtWuXljgp356eLedfRjMzpqHN+esysQKBgQD3joj2NdrBLIXk/ZuL
z4e/r991LFG5Mh8vN7G9pjuSKg9lhMqIraCavwU9Ex4NFM60PmTWIVeUKsKxDKSL
+u1PuOE6FIaWfEd3DjDAKM9RmpD2ONt1C0eklWcmaWZ3SyjVSjLni1Dh+1fhQYw9
D0rTsLVBKh5GoTsXiGqqj3JZrwKBgQD1NHrJcvU+YDbee15RaEiBt3hbpJJ2fjUl
xV4cH7veBdCbo4z30ts5pFWztm9dgf0fvbjEHWte4IJNTYyGAFAHBApjg58hxwbU
QGlStY5bTChC0Y7ZydUA8PfmnRFkfRsrNroPPj9m4K60npFuDxfwQWDsgjp7T37K
GIJg2vkaaQKBgQDySZCG2KKnWfoZ6pSoO49y7qDXv26kwQeAYRQWt3GqVnwHMfY/
2x9LFRX9do584xaDlmV+pddfbpJqUiNh1U8aLapR+/DVrAEN5teT2t090vd55J/1
Z/rQfGEeWR4uN2NZjWtQ7ytUYXjbQBoPUL49fb+Ibb6ABiEdoSg0knyqhQKBgQDy
l+xPOCwIfVprvTSwZ/MsWx9505WQJAdjCiS0wHS3EZu1EBec7IE2Qy8DMSB3K+8J
o0OUy+J5qLdh0bKQtOh4OHgqwoMDAQzxm5RYXwWrr+o5SWkCcdwKJV2uTIFzoQ7r
Lybfg99oYiyWyDbr44T0j0pcU++WJi0ztxHuz1Ya2QKBgDJAcDhy36VVlqJDGV36
f3/c1TAkw4NviZIzAdcIWYOfHQnnyEUHuMj9uDi+efer6Ww5KxgXYNvtJ8S++ddI
JaH4ksyqLkpQlU9oDsXoMG5pSwpfeSaTjsgaZmZYjnjL4wGfzvS9L89Z6Pk4eiP+
V/cjYLuoQEILa58q8TsIfC3D
-----END PRIVATE KEY-----`;

// Read the .env file
const envFile = fs.readFileSync('.env', 'utf8');

// Format the private key for .env file
const formattedKey = rawPrivateKey.replace(/\n/g, '\\n');

console.log("Private key format check:", {
  originalLength: rawPrivateKey.length,
  formattedLength: formattedKey.length,
  startsWithDash: rawPrivateKey.startsWith('-----BEGIN PRIVATE KEY-----'),
  endsWithDash: rawPrivateKey.endsWith('-----END PRIVATE KEY-----')
});

// Update the .env file with the formatted key
const updatedEnvFile = envFile.replace(
  /NEXT_PUBLIC_FIREBASE_PRIVATE_KEY=.*/,
  `NEXT_PUBLIC_FIREBASE_PRIVATE_KEY="${formattedKey}"`
);

// Write the updated .env file
fs.writeFileSync('.env', updatedEnvFile);

console.log("Private key has been updated in .env file");