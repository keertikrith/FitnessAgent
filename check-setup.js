#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if all environment variables are configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking AI Habit Tracker Setup...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('   Create .env file from .env.local.example\n');
  process.exit(1);
}

console.log('✅ .env file found');

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Required environment variables
const required = {
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase Project URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase Anon Key',
  'SUPABASE_SERVICE_KEY': 'Supabase Service Role Key',
  'GEMINI_API_KEY': 'Google Gemini API Key',
  'TWILIO_ACCOUNT_SID': 'Twilio Account SID',
  'TWILIO_AUTH_TOKEN': 'Twilio Auth Token',
  'TWILIO_FROM': 'Twilio WhatsApp Number',
  'WHATSAPP_TO': 'Your WhatsApp Number',
  'NEXT_PUBLIC_BASE_URL': 'App Base URL'
};

let allConfigured = true;

console.log('\n📋 Environment Variables:\n');

Object.entries(required).forEach(([key, description]) => {
  const value = envVars[key];
  if (value && value.length > 10) {
    const masked = value.substring(0, 10) + '...';
    console.log(`✅ ${key}`);
    console.log(`   ${description}: ${masked}`);
  } else if (value) {
    console.log(`⚠️  ${key}`);
    console.log(`   ${description}: ${value} (seems too short)`);
    allConfigured = false;
  } else {
    console.log(`❌ ${key}`);
    console.log(`   ${description}: NOT SET`);
    allConfigured = false;
  }
});

console.log('\n' + '='.repeat(50) + '\n');

if (allConfigured) {
  console.log('✅ All environment variables are configured!\n');
  console.log('📝 Next Steps:\n');
  console.log('1. Set up Supabase database:');
  console.log('   - Go to https://supabase.com/dashboard');
  console.log('   - Open SQL Editor');
  console.log('   - Run the SQL from supabase-schema.sql\n');
  console.log('2. Open http://localhost:3000 in your browser\n');
  console.log('3. Sign up and start tracking!\n');
  console.log('📚 See QUICKSTART.md for detailed instructions\n');
} else {
  console.log('⚠️  Some environment variables are missing or invalid\n');
  console.log('Please update your .env file with the correct values.\n');
  console.log('See .env.local.example for reference.\n');
  process.exit(1);
}
