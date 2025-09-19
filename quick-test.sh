#!/bin/bash

# Quick test script for Discord webhook
echo "🎯 Testing Discord Webhook Directly..."
echo ""

# Test Discord webhook
curl -X POST https://discord.com/api/webhooks/1418151913618145381/s98ZsH5mmS962BR1xgbhAiOWJ4Dv8ya-Bx_WlRNDzH1ip9NJ4iv-aWx0ODGe6MleGpMt \
  -H "Content-Type: application/json" \
  -d '{
    "content": "🚀 **Integration Test Message**",
    "embeds": [{
      "title": "✅ Discord Webhook Working!",
      "description": "This confirms your Discord webhook is correctly configured.",
      "color": 5763719,
      "fields": [
        {"name": "Test Time", "value": "'"$(date)"'", "inline": true},
        {"name": "Status", "value": "Connected", "inline": true}
      ],
      "footer": {
        "text": "Pipedrive-Discord Integration Test"
      }
    }]
  }' \
  -s -o /dev/null -w "HTTP Status: %{http_code}\n"

echo ""
echo "✅ If you see HTTP Status: 204, the webhook is working!"
echo "📱 Check your Discord channel for the test message."
echo ""
echo "Next: Run this command to complete setup:"
echo "node /Users/ben/Documents/Claude/pipedrive-discord-integration/setup-and-test.js"