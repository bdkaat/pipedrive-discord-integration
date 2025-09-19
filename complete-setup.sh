#!/bin/bash

echo "🤖 Claude's Automated Pipedrive-Discord Setup"
echo "=============================================="
echo ""

# Your configuration
DISCORD_WEBHOOK="https://discord.com/api/webhooks/1418151913618145381/s98ZsH5mmS962BR1xgbhAiOWJ4Dv8ya-Bx_WlRNDzH1ip9NJ4iv-aWx0ODGe6MleGpMt"
PIPEDRIVE_DOMAIN="fomoed"

# Step 1: Test Discord
echo "1️⃣  Testing Discord Webhook..."
DISCORD_RESPONSE=$(curl -X POST $DISCORD_WEBHOOK \
  -H "Content-Type: application/json" \
  -d '{
    "content": "🎉 **Automated Setup Started by Claude!**",
    "embeds": [{
      "title": "✅ Discord Connected Successfully",
      "description": "Your webhook is working! Now setting up the rest...",
      "color": 5763719,
      "fields": [
        {"name": "Status", "value": "Active", "inline": true},
        {"name": "Setup by", "value": "Claude AI", "inline": true}
      ]
    }]
  }' -s -o /dev/null -w "%{http_code}")

if [ "$DISCORD_RESPONSE" = "204" ]; then
    echo "   ✅ Discord webhook working!"
else
    echo "   ❌ Discord webhook failed (Status: $DISCORD_RESPONSE)"
    exit 1
fi

echo ""
echo "2️⃣  Finding your Railway deployment..."

# Try common Railway URLs
RAILWAY_URLS=(
    "pipedrive-discord-integration-production.up.railway.app"
    "pipedrive-discord-integration.up.railway.app"
    "pipedrive-discord-integration-production-bdkaat.up.railway.app"
)

RAILWAY_URL=""
for url in "${RAILWAY_URLS[@]}"; do
    echo "   Testing: $url"
    if curl -s -f -o /dev/null "https://$url/health" --max-time 3; then
        RAILWAY_URL=$url
        echo "   ✅ Found working Railway app!"
        break
    fi
done

if [ -z "$RAILWAY_URL" ]; then
    echo ""
    echo "   ⚠️  Could not auto-detect Railway URL"
    echo ""
    echo "   Please enter your Railway URL manually:"
    echo "   (Find it in Railway → Settings → Networking → Generated Domain)"
    echo ""
    read -p "   Railway URL (e.g., xyz.up.railway.app): " RAILWAY_URL
fi

echo ""
echo "3️⃣  Testing Railway deployment at: $RAILWAY_URL"

# Test health endpoint
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "https://$RAILWAY_URL/health")
if [ "$HEALTH_CHECK" = "200" ]; then
    echo "   ✅ Railway app is running!"
else
    echo "   ❌ Railway app not responding (Status: $HEALTH_CHECK)"
    echo "   Please check your Railway deployment"
    exit 1
fi

echo ""
echo "4️⃣  Sending test deals to Discord..."

# Test new deal
curl -X POST "https://$RAILWAY_URL/webhook/pipedrive" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "added.deal",
    "current": {
      "id": 1001,
      "title": "🚀 Test Deal - New Opportunity",
      "value": 50000,
      "currency": "USD",
      "person_name": "John Test",
      "org_name": "Test Corp",
      "user_name": "Your Team"
    }
  }' -s > /dev/null

echo "   ✅ Sent new deal notification"

sleep 1

# Test won deal
curl -X POST "https://$RAILWAY_URL/webhook/pipedrive" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "updated.deal",
    "current": {
      "id": 1002,
      "title": "🏆 Big Sale - CLOSED WON!",
      "value": 100000,
      "currency": "USD",
      "person_name": "Jane Success",
      "org_name": "Victory Inc",
      "status": "won"
    },
    "previous": {"status": "open"}
  }' -s > /dev/null

echo "   ✅ Sent won deal notification"

echo ""
echo "5️⃣  Pipedrive Webhook Configuration"
echo "===================================="
echo ""
echo "Copy this webhook URL:"
echo ""
echo "   🔗 https://$RAILWAY_URL/webhook/pipedrive"
echo ""
echo "Add it to Pipedrive:"
echo "   1. Go to Settings → Tools and apps → Webhooks"
echo "   2. Click 'Add webhook'"
echo "   3. Paste the URL above"
echo "   4. Event object: Deal"
echo "   5. Event action: ✓ Added, ✓ Updated"
echo "   6. HTTP Method: POST"
echo "   7. Click Save"
echo ""
echo "✅ Setup Complete!"
echo "=================="
echo "Check your Discord channel - you should see 2 test messages!"
echo ""
echo "If you don't see messages in Discord:"
echo "  1. Check Railway Variables tab for:"
echo "     DISCORD_WEBHOOK_URL=$DISCORD_WEBHOOK"
echo "     PIPEDRIVE_COMPANY_DOMAIN=$PIPEDRIVE_DOMAIN"
echo "     PIPEDRIVE_API_TOKEN=<your-token>"
echo "  2. Check Railway deployment logs for errors"
echo ""