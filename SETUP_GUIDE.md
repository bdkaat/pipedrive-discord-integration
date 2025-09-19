# Pipedrive Discord Integration - Complete Setup Guide

## Quick Start

I've created automated scripts to set up and test your integration. Run these commands in Terminal:

### 1. Quick Discord Test
```bash
chmod +x /Users/ben/Documents/Claude/pipedrive-discord-integration/quick-test.sh
/Users/ben/Documents/Claude/pipedrive-discord-integration/quick-test.sh
```

This will test if your Discord webhook is working.

### 2. Full Setup & Diagnostics
```bash
cd /Users/ben/Documents/Claude/pipedrive-discord-integration
node setup-and-test.js
```

This script will:
- Test Discord webhook ✅
- Test your Railway deployment
- Send test messages to Discord
- Show you exactly what to configure in Pipedrive
- Diagnose any issues

## Manual Checks

### Railway Status
1. Go to your Railway dashboard (already open in your browser)
2. Check if the deployment shows "Active"
3. Click on "View Logs" to see any errors

### Required Environment Variables in Railway
Go to Variables tab and ensure these are set:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1418151913618145381/s98ZsH5mmS962BR1xgbhAiOWJ4Dv8ya-Bx_WlRNDzH1ip9NJ4iv-aWx0ODGe6MleGpMt
PIPEDRIVE_COMPANY_DOMAIN=fomoed
PIPEDRIVE_API_TOKEN=<get from Pipedrive Settings → Personal → API>
```

### Pipedrive Webhook Configuration
1. You're already on the Webhooks page in Pipedrive
2. Click "Add webhook"
3. Use the URL from Railway (will be shown by the setup script)
4. Select Deal → Added and Updated
5. Method: POST

## Troubleshooting

If messages aren't appearing in Discord:

1. **Railway not deployed?**
   - Make sure you clicked "Deploy" in Railway
   - Check deployment logs for errors

2. **Missing API Token?**
   - Get from Pipedrive: Settings → Personal preferences → API
   - Add to Railway Variables tab

3. **Wrong webhook URL?**
   - Must end with `/webhook/pipedrive`
   - Must use your Railway domain

4. **Discord channel permissions?**
   - Make sure the webhook has permission to post in the channel

## File Structure
```
/Users/ben/Documents/Claude/pipedrive-discord-integration/
├── server.js           # Main application
├── package.json        # Dependencies
├── setup-and-test.js   # Automated setup script
├── quick-test.sh       # Quick Discord test
└── README.md          # This file
```