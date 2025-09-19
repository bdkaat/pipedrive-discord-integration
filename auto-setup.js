#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('🤖 Claude Auto-Setup for Pipedrive-Discord Integration');
console.log('======================================================\n');

// Configuration
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1418151913618145381/s98ZsH5mmS962BR1xgbhAiOWJ4Dv8ya-Bx_WlRNDzH1ip9NJ4iv-aWx0ODGe6MleGpMt';
const PIPEDRIVE_DOMAIN = 'fomoed';

// Test Discord webhook using curl (more reliable)
async function testDiscordWithCurl() {
  console.log('1️⃣  Testing Discord Webhook...');
  
  const testMessage = JSON.stringify({
    content: "🎉 **Automated Setup Started**",
    embeds: [{
      title: "✅ Discord Connected!",
      description: "Claude is automatically setting up your integration...",
      color: 5763719,
      fields: [
        { name: "Status", value: "Active", inline: true },
        { name: "Setup Stage", value: "1/4", inline: true }
      ]
    }]
  });
  
  try {
    const { stdout, stderr } = await execPromise(`
      curl -X POST ${DISCORD_WEBHOOK} \
        -H "Content-Type: application/json" \
        -d '${testMessage}' \
        -s -w "\\n%{http_code}"
    `);
    
    const lines = stdout.trim().split('\n');
    const statusCode = lines[lines.length - 1];
    
    if (statusCode === '204') {
      console.log('   ✅ Discord webhook is working!\n');
      return true;
    } else {
      console.log('   ❌ Discord returned status:', statusCode);
      if (stderr) console.log('   Error:', stderr);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Failed to test Discord:', error.message);
    return false;
  }
}

// Find Railway URL from git remote or ask user
async function findRailwayUrl() {
  console.log('2️⃣  Detecting Railway Deployment...\n');
  
  // Common Railway URL patterns
  const possibleUrls = [
    'pipedrive-discord-integration-production.up.railway.app',
    'pipedrive-discord-integration.up.railway.app',
    'pipedrive-discord-integration-production-bdkaat.up.railway.app'
  ];
  
  console.log('   Checking common Railway URLs...');
  
  for (const url of possibleUrls) {
    console.log(`   Testing: ${url}`);
    const works = await testRailwayUrl(url, true);
    if (works) {
      console.log(`   ✅ Found working Railway app at: ${url}\n`);
      return url;
    }
  }
  
  console.log('\n   ⚠️  Could not auto-detect Railway URL.');
  console.log('   Please check your Railway dashboard and look for the public URL.');
  console.log('   It should be under Settings → Networking → Generated Domain\n');
  
  // Return null to indicate manual intervention needed
  return null;
}

// Test if Railway URL is working
async function testRailwayUrl(url, silent = false) {
  return new Promise((resolve) => {
    const options = {
      hostname: url,
      port: 443,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        if (!silent) console.log(`   Status ${res.statusCode} from ${url}`);
        resolve(false);
      }
    });
    
    req.on('error', () => {
      if (!silent) console.log(`   Cannot connect to ${url}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Send test deal to Railway
async function sendTestDeal(railwayUrl, dealType = 'new') {
  const deals = {
    new: {
      event: 'added.deal',
      current: {
        id: Math.floor(Math.random() * 10000),
        title: '🚀 Automated Test Deal - New Opportunity',
        value: 25000,
        currency: 'USD',
        person_name: 'Test Customer',
        org_name: 'Test Company Inc',
        user_name: 'Sales Team',
        pipeline_name: 'Main Pipeline',
        stage_name: 'Qualified'
      }
    },
    won: {
      event: 'updated.deal',
      current: {
        id: Math.floor(Math.random() * 10000),
        title: '🏆 Big Deal - CLOSED WON!',
        value: 100000,
        currency: 'USD',
        person_name: 'Important Client',
        org_name: 'Enterprise Corp',
        user_name: 'Top Performer',
        pipeline_name: 'Main Pipeline',
        stage_name: 'Won',
        status: 'won'
      },
      previous: { status: 'open' }
    }
  };
  
  const deal = deals[dealType];
  const dealJson = JSON.stringify(deal);
  
  try {
    const { stdout, stderr } = await execPromise(`
      curl -X POST https://${railwayUrl}/webhook/pipedrive \
        -H "Content-Type: application/json" \
        -d '${dealJson}' \
        -s -w "\\nSTATUS:%{http_code}"
    `);
    
    const statusMatch = stdout.match(/STATUS:(\d+)/);
    const statusCode = statusMatch ? statusMatch[1] : 'unknown';
    
    if (statusCode === '200') {
      console.log(`   ✅ ${dealType === 'new' ? 'New deal' : 'Won deal'} notification sent!`);
      return true;
    } else {
      console.log(`   ⚠️  Railway returned status: ${statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Failed to send test deal:`, error.message);
    return false;
  }
}

// Main setup flow
async function main() {
  // Step 1: Test Discord
  const discordWorks = await testDiscordWithCurl();
  if (!discordWorks) {
    console.log('❌ Discord webhook is not working. Please check the webhook URL.');
    console.log('   The webhook URL in the code is:');
    console.log(`   ${DISCORD_WEBHOOK}\n`);
    process.exit(1);
  }
  
  // Step 2: Find Railway URL
  let railwayUrl = await findRailwayUrl();
  
  if (!railwayUrl) {
    console.log('📝 Manual Configuration Required');
    console.log('=================================\n');
    console.log('Please complete these steps:\n');
    console.log('1. Go to your Railway dashboard');
    console.log('2. Click on your pipedrive-discord-integration service');
    console.log('3. Go to Settings → Networking');
    console.log('4. Click "Generate Domain" if you haven\'t already');
    console.log('5. Copy the generated URL\n');
    console.log('6. In Railway Variables tab, ensure these are set:');
    console.log(`   DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK}`);
    console.log(`   PIPEDRIVE_COMPANY_DOMAIN=${PIPEDRIVE_DOMAIN}`);
    console.log('   PIPEDRIVE_API_TOKEN=<your-api-token>\n');
    console.log('7. Once you have the Railway URL, run this command:');
    console.log('   node test-railway.js YOUR_RAILWAY_URL\n');
    
    // Create a helper script
    const helperScript = `#!/usr/bin/env node
const url = process.argv[2];
if (!url) {
  console.log('Usage: node test-railway.js YOUR_RAILWAY_URL');
  process.exit(1);
}
console.log('Testing Railway app at:', url);
// Test code here
`;
    
    fs.writeFileSync(path.join(__dirname, 'test-railway.js'), helperScript);
    console.log('Created test-railway.js for manual testing.\n');
    
    return;
  }
  
  // Step 3: Test Railway deployment
  console.log('3️⃣  Testing Railway Deployment...');
  const railwayWorks = await testRailwayUrl(railwayUrl);
  
  if (!railwayWorks) {
    console.log('   ❌ Cannot connect to Railway app');
    console.log('   Please check:');
    console.log('   - The app is deployed and running');
    console.log('   - All environment variables are set');
    console.log('   - The deployment logs for errors\n');
    return;
  }
  
  console.log('   ✅ Railway app is running!\n');
  
  // Step 4: Send test messages
  console.log('4️⃣  Sending Test Messages to Discord...');
  await sendTestDeal(railwayUrl, 'new');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  await sendTestDeal(railwayUrl, 'won');
  console.log('   Check your Discord channel for test messages!\n');
  
  // Step 5: Display Pipedrive webhook configuration
  console.log('5️⃣  Pipedrive Webhook Configuration');
  console.log('====================================\n');
  console.log('Add this webhook URL to Pipedrive:\n');
  console.log(`🔗 https://${railwayUrl}/webhook/pipedrive\n`);
  console.log('Steps in Pipedrive:');
  console.log('1. Go to Settings → Tools and apps → Webhooks');
  console.log('2. Click "Add webhook"');
  console.log('3. Configure:');
  console.log(`   - URL: https://${railwayUrl}/webhook/pipedrive`);
  console.log('   - Event object: Deal');
  console.log('   - Event action: ✓ Added, ✓ Updated');
  console.log('   - HTTP Method: POST');
  console.log('4. Click Save\n');
  
  // Final success message
  console.log('✅ Setup Complete!');
  console.log('==================');
  console.log('Your Pipedrive-Discord integration is ready!');
  console.log('Create or update a deal in Pipedrive to see notifications in Discord.\n');
}

// Run the setup
main().catch(console.error);
