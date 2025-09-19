// test-discord-webhook.js
const axios = require('axios');

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1418151913618145381/s98ZsH5mmS962BR1xgbhAiOWJ4Dv8ya-Bx_WlRNDzH1ip9NJ4iv-aWx0ODGe6MleGpMt';

async function testWebhook() {
  try {
    const response = await axios.post(DISCORD_WEBHOOK_URL, {
      content: "🎉 Test message! If you see this, your Discord webhook is working!",
      embeds: [{
        title: "✅ Webhook Test Successful",
        description: "Your Discord webhook is properly configured!",
        color: 0x00ff00,
        fields: [
          {
            name: "Status",
            value: "Connected",
            inline: true
          },
          {
            name: "Time",
            value: new Date().toISOString(),
            inline: true
          }
        ]
      }]
    });
    console.log('Success! Message sent to Discord');
    console.log('Response status:', response.status);
  } catch (error) {
    console.error('Error sending to Discord:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
  }
}

testWebhook();
