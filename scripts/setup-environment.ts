#!/usr/bin/env node

/**
 * Environment Configuration Helper
 * This script helps you set up the required environment variables for the Budget Bot application.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

console.log('🚀 Budget Bot Environment Configuration Helper')
console.log('=' .repeat(50))

// Check current environment status
function checkEnvironmentStatus() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
    'NEXT_PUBLIC_PUSHER_APP_KEY',
    'PUSHER_APP_ID',
    'PUSHER_SECRET',
    'NEXT_PUBLIC_PUSHER_CLUSTER'
  ]

  const optionalEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'SENDPULSE_API_USER_ID',
    'SENDPULSE_API_SECRET',
    'EASYCRON_API_TOKEN',
    'LOGO_DEV_API_KEY'
  ]

  console.log('\n📋 Environment Variables Status:')
  console.log('-'.repeat(30))

  let missingRequired = 0
  let missingOptional = 0

  // Check required variables
  console.log('\n🔴 Required Variables:')
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar]
    const status = value && value !== 'your_' + envVar.toLowerCase() + '_here' 
                   && !value.includes('your-') ? '✅' : '❌'
    
    if (status === '❌') missingRequired++
    
    console.log(`${status} ${envVar}: ${value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'Not set'}`)
  })

  // Check optional variables
  console.log('\n🟡 Optional Variables:')
  optionalEnvVars.forEach(envVar => {
    const value = process.env[envVar]
    const status = value && value !== 'your_' + envVar.toLowerCase() + '_here' 
                   && !value.includes('your-') ? '✅' : '⚪'
    
    if (status === '⚪') missingOptional++
    
    console.log(`${status} ${envVar}: ${value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'Not set'}`)
  })

  console.log('\n📊 Summary:')
  console.log(`Required: ${requiredEnvVars.length - missingRequired}/${requiredEnvVars.length} configured`)
  console.log(`Optional: ${optionalEnvVars.length - missingOptional}/${optionalEnvVars.length} configured`)

  return { missingRequired, missingOptional, total: missingRequired + missingOptional }
}

// Provide setup instructions
function provideSetupInstructions() {
  console.log('\n🛠️  Setup Instructions:')
  console.log('=' .repeat(50))

  console.log('\n1. 🗄️  Supabase Configuration:')
  console.log('   • Go to https://app.supabase.com/projects')
  console.log('   • Select your project')
  console.log('   • Go to Settings > API')
  console.log('   • Copy the "service_role" key (NOT the anon key)')
  console.log('   • Add it to your .env.local file as SUPABASE_SERVICE_ROLE_KEY')

  console.log('\n2. 🤖 Gemini AI Configuration:')
  console.log('   • Go to https://aistudio.google.com/app/apikey')
  console.log('   • Create a new API key')
  console.log('   • Add it to your .env.local file as GEMINI_API_KEY')

  console.log('\n3. 📡 Pusher Configuration:')
  console.log('   • Go to https://dashboard.pusher.com/')
  console.log('   • Create a new app or select existing')
  console.log('   • Copy App ID, Key, Secret, and Cluster')
  console.log('   • Add them to your .env.local file')

  console.log('\n4. 🔗 Optional Integrations:')
  console.log('   • Google Calendar: https://console.developers.google.com/')
  console.log('   • SendPulse: https://login.sendpulse.com/settings/api')
  console.log('   • Logo.dev: https://www.logo.dev/api')

  console.log('\n5. 🧪 Test Configuration:')
  console.log('   • Run: npm run dev')
  console.log('   • Visit: http://localhost:3000/integration-test')
  console.log('   • Check all service integrations')
}

// Test basic connectivity
async function testConnectivity() {
  console.log('\n🔍 Testing Basic Connectivity:')
  console.log('-'.repeat(30))

  // Test Supabase connection
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('✅ Supabase: Configuration found')
    } else {
      console.log('❌ Supabase: Missing required environment variables')
    }
  } catch (error) {
    console.log('❌ Supabase: Connection failed', error)
  }

  // Test Pusher configuration
  if (process.env.NEXT_PUBLIC_PUSHER_APP_KEY && process.env.PUSHER_SECRET) {
    console.log('✅ Pusher: Configuration found')
  } else {
    console.log('❌ Pusher: Missing configuration')
  }

  // Test Gemini API
  if (process.env.GEMINI_API_KEY) {
    console.log('✅ Gemini AI: API key found')
  } else {
    console.log('❌ Gemini AI: API key missing')
  }
}

// Main execution
async function main() {
  const status = checkEnvironmentStatus()
  
  if (status.missingRequired > 0) {
    console.log('\n⚠️  Missing required environment variables!')
    provideSetupInstructions()
  } else {
    console.log('\n🎉 All required environment variables are configured!')
    await testConnectivity()
  }

  console.log('\n🔗 Helpful Links:')
  console.log('   • Environment Example: .env.example')
  console.log('   • Integration Tests: /integration-test')
  console.log('   • Documentation: README.md')
  console.log('\n' + '='.repeat(50))
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { checkEnvironmentStatus, provideSetupInstructions, testConnectivity }