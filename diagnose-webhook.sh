#!/bin/bash

echo "🔍 Pipedrive Webhook Diagnostic"
echo "================================"
echo ""

# Get Railway URL from user
echo "What's your Railway URL? (from the previous test)"
read -p "Railway URL (e.g., xyz.up.railway.app): " RAILWAY_URL

echo ""
echo "📋 Checklist for Pipedrive Webhooks:"
echo ""
echo "1. In Pipedrive, go to: Settings → Tools and apps → Webhooks"
echo ""
echo "2. Your webhook should have these EXACT settings:"
echo "   ✅ URL: https://$RAILWAY_URL/webhook/pipedrive"
echo "   ✅ Event object: Deal"
echo "   ✅ Event action: Both 'Added' AND 'Updated' must be checked"
echo "   ✅ HTTP Method: POST"
echo "   ✅ Status: Active (not paused)"
echo ""
echo "3. Common issues to check:"
echo ""
echo "   ❓ Is the webhook URL EXACTLY: https://$RAILWAY_URL/webhook/pipedrive"
echo "      (Not missing the /webhook/pipedrive part?)"
echo ""
echo "   ❓ Are BOTH 'Added' and 'Updated' checked for Deal events?"
echo "      (If only 'Added' is checked, moving deals won't trigger it)"
echo ""
echo "   ❓ Is the webhook Active (not paused)?"
echo ""
echo "   ❓ Do you see any failed deliveries in the webhook details?"
echo "      (Click on the webhook to see delivery history)"
echo ""
echo "4. Let's test with a real Pipedrive API call:"
echo ""
echo "Please enter your Pipedrive API token:"
echo "(Get it from: Settings → Personal preferences → API)"
read -s -p "API Token: " PIPEDRIVE_TOKEN
echo ""
echo ""

# Test Pipedrive API
echo "Testing Pipedrive API..."
API_TEST=$(curl -s -o /dev/null -w "%{http_code}" "https://fomoed.pipedrive.com/api/v1/deals?api_token=$PIPEDRIVE_TOKEN&limit=1")

if [ "$API_TEST" = "200" ]; then
    echo "✅ Pipedrive API working!"
else
    echo "❌ Pipedrive API failed (Status: $API_TEST)"
    echo "Please check your API token"
fi

echo ""
echo "5. Creating a test deal via Pipedrive API..."

# Create a test deal
DEAL_RESPONSE=$(curl -s -X POST "https://fomoed.pipedrive.com/api/v1/deals?api_token=$PIPEDRIVE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🧪 Webhook Test Deal (created by Claude)",
    "value": 1000,
    "currency": "USD",
    "status": "open"
  }')

DEAL_ID=$(echo $DEAL_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

if [ ! -z "$DEAL_ID" ]; then
    echo "✅ Created test deal #$DEAL_ID"
    echo ""
    echo "⏳ Waiting 3 seconds for webhook to trigger..."
    sleep 3
    
    echo ""
    echo "📝 Now updating the deal to trigger 'updated' webhook..."
    
    # Update the deal to won
    curl -s -X PUT "https://fomoed.pipedrive.com/api/v1/deals/$DEAL_ID?api_token=$PIPEDRIVE_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "won"}' > /dev/null
    
    echo "✅ Marked deal as won"
    echo ""
    echo "🔔 Check your Discord channel now!"
    echo "   You should see 2 messages:"
    echo "   1. New deal notification"
    echo "   2. Deal won notification"
    echo ""
    echo "If you DON'T see messages in Discord:"
    echo "   → The webhook in Pipedrive is not configured correctly"
    echo "   → Double-check the webhook URL and settings above"
    echo ""
    echo "If you DO see messages:"
    echo "   → Everything is working! 🎉"
    
    # Clean up - delete test deal
    echo ""
    read -p "Delete the test deal? (y/n): " DELETE_DEAL
    if [ "$DELETE_DEAL" = "y" ]; then
        curl -s -X DELETE "https://fomoed.pipedrive.com/api/v1/deals/$DEAL_ID?api_token=$PIPEDRIVE_TOKEN" > /dev/null
        echo "✅ Test deal deleted"
    fi
else
    echo "❌ Failed to create test deal"
    echo "Response: $DEAL_RESPONSE"
fi

echo ""
echo "6. Checking Railway logs..."
echo ""
echo "To see if webhooks are reaching your server:"
echo "   1. Go to Railway dashboard"
echo "   2. Click on your service"
echo "   3. Go to 'Deployments' tab"
echo "   4. Click 'View Logs'"
echo "   5. Look for 'Received webhook' messages"
echo ""
echo "If you see webhook messages in Railway logs but NOT in Discord:"
echo "   → Check Railway Variables tab for correct DISCORD_WEBHOOK_URL"
echo ""
echo "If you DON'T see webhook messages in Railway logs:"
echo "   → Pipedrive webhook is not configured correctly"
echo "   → The webhook URL might be wrong"
echo ""