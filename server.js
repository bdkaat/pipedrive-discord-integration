// server.js
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Configuration
const CONFIG = {
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL, // Your Discord webhook URL
  PIPEDRIVE_API_TOKEN: process.env.PIPEDRIVE_API_TOKEN, // Your Pipedrive API token
  PIPEDRIVE_COMPANY_DOMAIN: process.env.PIPEDRIVE_COMPANY_DOMAIN, // e.g., 'yourcompany'
  PORT: process.env.PORT || 3000,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET // Optional: for webhook verification
};

// Celebration emojis and messages
const celebrations = {
  newDeal: [
    { emoji: '🎉', message: 'NEW DEAL ALERT!' },
    { emoji: '🚀', message: 'DEAL LAUNCHED!' },
    { emoji: '✨', message: 'FRESH OPPORTUNITY!' },
    { emoji: '🎊', message: 'NEW DEAL INCOMING!' },
    { emoji: '💫', message: 'OPPORTUNITY KNOCKING!' }
  ],
  wonDeal: [
    { emoji: '🏆', message: 'DEAL WON!' },
    { emoji: '🎯', message: 'BULLSEYE! DEAL CLOSED!' },
    { emoji: '🥳', message: 'VICTORY!' },
    { emoji: '🔥', message: 'ON FIRE! DEAL CLOSED!' },
    { emoji: '💰', message: 'KA-CHING! DEAL WON!' }
  ]
};

// Get random celebration
function getRandomCelebration(type) {
  const options = celebrations[type];
  return options[Math.floor(Math.random() * options.length)];
}

// Format currency
function formatCurrency(value, currency = 'USD') {
  if (!value) return 'Not specified';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(value);
}

// Create Discord embed message
function createDiscordMessage(dealData, eventType) {
  const isNewDeal = eventType === 'added';
  const celebration = getRandomCelebration(isNewDeal ? 'newDeal' : 'wonDeal');
  
  // Random fun messages
  const funMessages = isNewDeal ? [
    'Time to make magic happen! ✨',
    'Let\'s turn this opportunity into gold! 🏅',
    'Another chance to shine! 🌟',
    'The journey begins! 🚂',
    'Opportunity is knocking loud! 🚪'
  ] : [
    'Pop the champagne! 🍾',
    'Victory dance time! 🕺',
    'We are CRUSHING it! 💪',
    'Another one for the win column! 📊',
    'Success tastes sweet! 🍰'
  ];
  
  const randomFunMessage = funMessages[Math.floor(Math.random() * funMessages.length)];
  
  // Build the embed
  const embed = {
    title: `${celebration.emoji} ${celebration.message} ${celebration.emoji}`,
    description: randomFunMessage,
    color: isNewDeal ? 0x00ff00 : 0xffd700, // Green for new, gold for won
    fields: [
      {
        name: '📝 Deal Name',
        value: dealData.title || 'Unnamed Deal',
        inline: true
      },
      {
        name: '💵 Value',
        value: formatCurrency(dealData.value, dealData.currency),
        inline: true
      }
    ],
    footer: {
      text: `Pipedrive ${isNewDeal ? 'New Deal' : 'Deal Won'}`,
      icon_url: 'https://cdn.worldvectorlogo.com/logos/pipedrive.svg'
    },
    timestamp: new Date().toISOString()
  };

  // Add optional fields
  if (dealData.person_name) {
    embed.fields.push({
      name: '👤 Contact',
      value: dealData.person_name,
      inline: true
    });
  }
  
  if (dealData.org_name) {
    embed.fields.push({
      name: '🏢 Organization',
      value: dealData.org_name,
      inline: true
    });
  }
  
  if (dealData.user_name) {
    embed.fields.push({
      name: '🎯 Deal Owner',
      value: dealData.user_name,
      inline: true
    });
  }
  
  if (dealData.pipeline_name) {
    embed.fields.push({
      name: '📊 Pipeline',
      value: dealData.pipeline_name,
      inline: true
    });
  }
  
  if (dealData.stage_name) {
    embed.fields.push({
      name: '📍 Stage',
      value: dealData.stage_name,
      inline: true
    });
  }
  
  if (dealData.expected_close_date) {
    embed.fields.push({
      name: '📅 Expected Close',
      value: new Date(dealData.expected_close_date).toLocaleDateString(),
      inline: true
    });
  }

  // Add deal link if available
  if (CONFIG.PIPEDRIVE_COMPANY_DOMAIN && dealData.id) {
    embed.url = `https://${CONFIG.PIPEDRIVE_COMPANY_DOMAIN}.pipedrive.com/deal/${dealData.id}`;
    embed.fields.push({
      name: '🔗 Quick Access',
      value: `[View in Pipedrive](${embed.url})`,
      inline: false
    });
  }

  return {
    content: isNewDeal ? '@here New opportunity!' : '@here Celebration time! 🎉',
    embeds: [embed]
  };
}

// Send message to Discord
async function sendToDiscord(message) {
  try {
    await axios.post(CONFIG.DISCORD_WEBHOOK_URL, message);
    console.log('Message sent to Discord successfully');
    return true;
  } catch (error) {
    console.error('Error sending to Discord:', error.response?.data || error.message);
    return false;
  }
}

// Webhook endpoint for Pipedrive
app.post('/webhook/pipedrive', async (req, res) => {
  console.log('Received webhook:', req.body);
  
  // Optional: Verify webhook signature if you set up a secret
  if (CONFIG.WEBHOOK_SECRET && req.headers['x-pipedrive-signature']) {
    const signature = crypto
      .createHmac('sha256', CONFIG.WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signature !== req.headers['x-pipedrive-signature']) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }
  
  const { event, current, previous } = req.body;
  
  // Check if this is a relevant event
  if (!event || !current) {
    return res.status(400).json({ error: 'Invalid webhook data' });
  }
  
  // Handle new deal creation
  if (event === 'added.deal') {
    const discordMessage = createDiscordMessage(current, 'added');
    await sendToDiscord(discordMessage);
    return res.json({ status: 'New deal notification sent' });
  }
  
  // Handle deal won (deal updated with status = won)
  if (event === 'updated.deal' && current.status === 'won' && previous?.status !== 'won') {
    const discordMessage = createDiscordMessage(current, 'won');
    await sendToDiscord(discordMessage);
    return res.json({ status: 'Deal won notification sent' });
  }
  
  // Event not relevant for notifications
  res.json({ status: 'Event received but no notification needed' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Pipedrive-Discord Integration',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pipedrive-Discord Integration is running!',
    endpoints: {
      webhook: '/webhook/pipedrive',
      health: '/health'
    }
  });
});

// Start server
app.listen(CONFIG.PORT, () => {
  console.log(`Server running on port ${CONFIG.PORT}`);
  console.log('Ready to receive Pipedrive webhooks');
  
  // Check configuration
  if (!CONFIG.DISCORD_WEBHOOK_URL) {
    console.warn('⚠️  DISCORD_WEBHOOK_URL not set');
  }
  if (!CONFIG.PIPEDRIVE_COMPANY_DOMAIN) {
    console.warn('⚠️  PIPEDRIVE_COMPANY_DOMAIN not set');
  }
});