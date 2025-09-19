#!/usr/bin/env node

/**
 * Automated Pipedrive-Discord Integration Setup & Debugger
 * This script will test and fix your integration automatically
 */

const https = require('https');
const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1418151913618145381/s98ZsH5mmS962BR1xgbhAiOWJ4Dv8ya-Bx_WlRNDzH1ip9NJ4iv-aWx0ODGe6MleGpMt';

console.log('🔧 Pipedrive-Discord Integration Setup & Debugger');
console.log('=================================================\n');

// Function to make HTTP requests
function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body, headers: res.headers });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test Discord webhook
async function testDiscord() {
  console.log('1️⃣  Testing Discord Webhook...');
  
  try {
    const response = await makeRequest(DISCORD_WEBHOOK, 
      { method: 'POST' },
      {
        content: "✅ **Discord webhook is working!**",
        embeds: [{
          title: "Integration Test",
          description: "If you see this message, your Discord webhook is properly configured!",
          color: 0x00ff00,
          timestamp: new Date().toISOString(),
          fields: [
            { name: "Status", value: "✅ Connected", inline: true },
            { name: "Test Type", value: "Direct webhook test", inline: true }
          ]
        }]
      }
    );
    
    if (response.status === 204) {
      console.log('   ✅ Discord webhook is working!\n');
      return true;
    } else {
      console.log('   ❌ Discord webhook returned unexpected status:', response.status);
      console.log('   Response:', response.body, '\n');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Failed to connect to Discord:', error.message, '\n');
    return false;
  }
}

// Get Railway URL from user
async function getRailwayUrl() {
  return new Promise((resolve) => {
    console.log('2️⃣  Railway Configuration');
    console.log('   Please enter your Railway app URL.');
    console.log('   (You can find this in Railway → Settings → Networking → Generated Domain)');
    console.log('   Example: pipedrive-discord-integration-production.up.railway.app\n');
    
    rl.question('   Railway URL (without https://): ', (answer) => {
      const url = answer.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      console.log(`   Using: https://${url}\n`);
      resolve(url);
    });
  });
}

// Test Railway deployment
async function testRailway(railwayUrl) {
  console.log('3️⃣  Testing Railway Deployment...');
  
  // Test health endpoint
  try {
    console.log('   Testing health endpoint...');
    const healthResponse = await makeRequest(`https://${railwayUrl}/health`);
    
    if (healthResponse.status === 200) {
      const data = JSON.parse(healthResponse.body);
      console.log('   ✅ Railway app is running!');
      console.log(`   Status: ${data.status}`);
      console.log(`   Service: ${data.service}\n`);
    } else {
      console.log('   ⚠️  Health endpoint returned:', healthResponse.status);
      console.log('   Body:', healthResponse.body, '\n');
    }
  } catch (error) {
    console.log('   ❌ Cannot connect to Railway app:', error.message);
    console.log('   Make sure your app is deployed and the URL is correct.\n');
    return false;
  }
  
  // Test webhook endpoint with a fake deal
  console.log('4️⃣  Testing Webhook Endpoint...');
  console.log('   Sending test deal to your Railway app...');
  
  try {
    const testDeal = {
      event: 'added.deal',
      current: {
        id: 999,
        title: '🧪 Test Deal from Setup Script',
        value: 10000,
        currency: 'USD',
        person_name: 'John Test',
        org_name: 'Test Corp',
        user_name: 'Your Name',
        pipeline_name: 'Sales Pipeline',
        stage_name: 'Qualified',
        status: 'open'
      }
    };
    
    const webhookResponse = await makeRequest(
      `https://${railwayUrl}/webhook/pipedrive`,
      { method: 'POST' },
      testDeal
    );
    
    if (webhookResponse.status === 200) {
      console.log('   ✅ Webhook endpoint is working!');
      console.log('   Check Discord for the test message!\n');
      return true;
    } else {
      console.log('   ⚠️  Webhook returned:', webhookResponse.status);
      console.log('   Body:', webhookResponse.body, '\n');
    }
  } catch (error) {
    console.log('   ❌ Webhook test failed:', error.message, '\n');
    return false;
  }
  
  return true;
}

// Generate Pipedrive webhook setup instructions
function showPipedriveInstructions(railwayUrl) {
  console.log('5️⃣  Pipedrive Webhook Configuration');
  console.log('   =====================================');
  console.log('   Copy this webhook URL to Pipedrive:\n');
  console.log(`   🔗 https://${railwayUrl}/webhook/pipedrive\n`);
  console.log('   Steps in Pipedrive:');
  console.log('   1. Go to Settings → Tools and apps → Webhooks');
  console.log('   2. Click "Add webhook"');
  console.log('   3. Paste the webhook URL above');
  console.log('   4. Event object: Deal');
  console.log('   5. Event action: Check both "added" and "updated"');
  console.log('   6. HTTP Method: POST');
  console.log('   7. Click Save\n');
}

// Check environment variables
async function checkEnvironmentVariables(railwayUrl) {
  console.log('6️⃣  Environment Variables Check');
  console.log('   ==============================');
  console.log('   Make sure these are set in Railway (Variables tab):\n');
  console.log('   ✅ DISCORD_WEBHOOK_URL=' + DISCORD_WEBHOOK);
  console.log('   ✅ PIPEDRIVE_COMPANY_DOMAIN=fomoed');
  console.log('   ❓ PIPEDRIVE_API_TOKEN=<your-api-token>');
  console.log('      (Get from Pipedrive → Settings → Personal → API)\n');
  
  return new Promise((resolve) => {
    rl.question('   Have you set the PIPEDRIVE_API_TOKEN in Railway? (yes/no): ', (answer) => {
      if (answer.toLowerCase().startsWith('y')) {
        console.log('   Great! Your integration should be fully functional.\n');
      } else {
        console.log('   ⚠️  Please add your PIPEDRIVE_API_TOKEN in Railway Variables tab');
        console.log('   Without it, some features may not work properly.\n');
      }
      resolve();
    });
  });
}

// Test a won deal
async function testWonDeal(railwayUrl) {
  console.log('7️⃣  Testing "Deal Won" Notification...');
  
  const wonDeal = {
    event: 'updated.deal',
    current: {
      id: 1000,
      title: '🏆 Big Sale - CLOSED WON!',
      value: 50000,
      currency: 'USD',
      person_name: 'Jane Success',
      org_name: 'Victory Company',
      user_name: 'Top Seller',
      pipeline_name: 'Sales Pipeline',
      stage_name: 'Won',
      status: 'won'
    },
    previous: {
      status: 'open'
    }
  };
  
  try {
    const response = await makeRequest(
      `https://${railwayUrl}/webhook/pipedrive`,
      { method: 'POST' },
      wonDeal
    );
    
    if (response.status === 200) {
      console.log('   ✅ Won deal notification sent to Discord!\n');
    } else {
      console.log('   ⚠️  Response:', response.body, '\n');
    }
  } catch (error) {
    console.log('   ❌ Failed:', error.message, '\n');
  }
}

// Main execution
async function main() {
  try {
    // Test Discord first
    const discordWorks = await testDiscord();
    
    if (!discordWorks) {
      console.log('❌ Discord webhook is not working. Please check the webhook URL.');
      rl.close();
      return;
    }
    
    // Get Railway URL
    const railwayUrl = await getRailwayUrl();
    
    // Test Railway
    const railwayWorks = await testRailway(railwayUrl);
    
    if (railwayWorks) {
      // Test won deal
      await testWonDeal(railwayUrl);
      
      // Show Pipedrive instructions
      showPipedriveInstructions(railwayUrl);
      
      // Check environment variables
      await checkEnvironmentVariables(railwayUrl);
      
      console.log('✨ Setup Complete!');
      console.log('==================');
      console.log('Your integration is ready to use!');
      console.log('Create or close a deal in Pipedrive to see it in Discord.\n');
    } else {
      console.log('❌ Railway deployment issues detected.');
      console.log('Please check:');
      console.log('1. The app is deployed in Railway');
      console.log('2. All environment variables are set');
      console.log('3. The deployment logs in Railway for errors\n');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

// Run the script
main();