/**
 * Generate Encryption Key Script
 * 
 * Run this script to generate a secure encryption key for API keys storage
 * 
 * Usage: npm run generate-key
 * Or: npx tsx src/scripts/generate-encryption-key.ts
 */

import crypto from 'crypto';

console.log('\n🔐 Encryption Key Generator\n');
console.log('═'.repeat(60));

// Generate a 256-bit (32-byte) key
const key = crypto.randomBytes(32).toString('hex');

console.log('\n✅ Your secure encryption key:\n');
console.log(`   ${key}\n`);
console.log('═'.repeat(60));
console.log('\n📋 Add this to your .env file:\n');
console.log(`   ENCRYPTION_KEY=${key}\n`);
console.log('═'.repeat(60));
console.log('\n⚠️  IMPORTANT SECURITY NOTES:\n');
console.log('   • NEVER commit this key to version control');
console.log('   • Use different keys for development and production');
console.log('   • Store production keys in a secure secrets manager');
console.log('   • If you lose this key, you cannot decrypt existing data');
console.log('   • Keep a secure backup of this key\n');
console.log('═'.repeat(60));
console.log('\n🔒 This key uses AES-256-GCM encryption standard\n');

// Generate a few more keys for different environments
console.log('💡 Additional keys for different environments:\n');
console.log(`   Development:  ${crypto.randomBytes(32).toString('hex')}`);
console.log(`   Staging:      ${crypto.randomBytes(32).toString('hex')}`);
console.log(`   Production:   ${crypto.randomBytes(32).toString('hex')}\n`);

