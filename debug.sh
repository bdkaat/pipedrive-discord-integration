#!/bin/bash

# Debugging script for Pipedrive-Discord Integration

echo "🔍 Pipedrive-Discord Integration Debugger"
echo "========================================="
echo ""

# Test Discord Webhook
echo "1. Testing Discord Webhook..."
curl -X POST https://discord.com/api/webhooks/1418151913618145381/s98ZsH5mmS962BR1xgbhAiOWJ4Dv8ya-Bx_WlRNDzH1ip9NJ4iv-aWx0ODGe6MleGpMt \
  -H "Content-Type: application/json" \
  -d '{"content":"✅ Discord webhook is working! Test from debugging script."}' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "2. Please provide your Railway app URL:"
read -p "Railway URL (e.g., xyz.up.railway.app): " RAILWAY_URL

# Test Railway health endpoint
echo ""
echo "3. Testing Railway deployment..."
curl -X GET https://$RAILWAY_URL/health \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "4. Testing webhook endpoint..."
curl -X POST https://$RAILWAY_URL/webhook/pipedrive \
  -H "Content-Type: application/json" \
  -d '{
    "event": "added.deal",
    "current": {
      "id": 1,
      "title": "Test Deal from Debug Script",
      "value": 5000,
      "currency": "USD",
      "person_name": "Test Person",
      "org_name": "Test Organization",
      "user_name": "Test User",
      "status": "open"
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Debug tests complete!"
echo ""
echo "Check your Discord channel for test messages."
echo "If you don't see them, check Railway logs for errors."
