#!/bin/bash

echo "🔧 Deploying webhook fix to Railway..."
echo ""

cd /Users/ben/Documents/Claude/pipedrive-discord-integration

# Git commands to push the fix
git add server.js
git commit -m "Fix: Accept webhooks on root path (/) as well as /webhook/pipedrive"
git push origin main

echo ""
echo "✅ Fix pushed to GitHub!"
echo ""
echo "Railway will auto-deploy in ~30 seconds"
echo ""
echo "The fix allows webhooks on BOTH:"
echo "  • https://pipedrive-discord-integration-production.up.railway.app/"
echo "  • https://pipedrive-discord-integration-production.up.railway.app/webhook/pipedrive"
echo ""
echo "So it will work regardless of which URL Pipedrive is using!"
echo ""
echo "Wait 30 seconds, then create a test deal in Pipedrive."