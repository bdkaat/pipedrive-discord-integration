// server.js - FIXED VERSION
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Configuration
const CONFIG = {
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
  PIPEDRIVE_API_TOKEN: process.env.PIPEDRIVE_API_TOKEN,
  PIPEDRIVE_COMPANY_DOMAIN: process.env.PIPEDRIVE_COMPANY_DOMAIN,
  PORT: process.env.PORT || 3000,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET
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
  
  const embed = {
    title: `${celebration.emoji} ${celebration.message} ${celebration.emoji}`,
    description: randomFunMessage,
    color: isNewDeal ? 0x00ff00 : 0xffd700,
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

  if (CONFIG.PIPEDRIVE_COMPANY_DOMAIN && dealData.id) {
    embed.url = `https://${CONFIG.PIPEDRIVE_COMPANY_DOMAIN}.pipedrive.com/deal/${dealData.id}`;
  }

  return {
    content: isNewDeal ? '🎉 New opportunity!' : '🎊 Celebration time!',
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

// Main webhook handler function
async function handlePipedriveWebhook(req, res) {
  console.log('Received webhook:', JSON.stringify(req.body, null, 2));
  
  const { event, current, previous, meta } = req.body;
  
  // Handle both event formats (Pipedrive v1 and simple format)
  let eventType = event;
  let dealData = current;
  
  // If meta exists, this is Pipedrive v1 format
  if (meta && meta.action && meta.object) {
    eventType = `${meta.action}.${meta.object}`;
    console.log('Detected Pipedrive v1 format, event:', eventType);
  }
  
  if (!eventType || !dealData) {
    console.log('Invalid webhook data - missing event or current data');
    return res.status(400).json({ error: 'Invalid webhook data' });
  }
  
  // Handle new deal creation
  if (eventType === 'added.deal') {
    console.log('Processing new deal:', dealData.title);
    const discordMessage = createDiscordMessage(dealData, 'added');
    await sendToDiscord(discordMessage);
    return res.json({ status: 'New deal notification sent' });
  }
  
  // Handle deal won
  if (eventType === 'updated.deal' && dealData.status === 'won' && (!previous || previous.status !== 'won')) {
    console.log('Processing won deal:', dealData.title);
    const discordMessage = createDiscordMessage(dealData, 'won');
    await sendToDiscord(discordMessage);
    return res.json({ status: 'Deal won notification sent' });
  }
  
  // Log other events for debugging
  console.log('Event not processed:', eventType, 'Status:', dealData.status);
  res.json({ status: 'Event received but no notification needed' });
}

// IMPORTANT: Accept webhooks on BOTH root and /webhook/pipedrive paths
app.post('/', handlePipedriveWebhook);
app.post('/webhook/pipedrive', handlePipedriveWebhook);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Pipedrive-Discord Integration',
    timestamp: new Date().toISOString()
  });
});

// Root GET endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pipedrive-Discord Integration is running!',
    endpoints: {
      webhook: '/ or /webhook/pipedrive (POST)',
      health: '/health (GET)'
    }
  });
});

// Start server
app.listen(CONFIG.PORT, () => {
  console.log(`Server running on port ${CONFIG.PORT}`);
  console.log('Ready to receive Pipedrive webhooks on / or /webhook/pipedrive');
  
  if (!CONFIG.DISCORD_WEBHOOK_URL) {
    console.warn('⚠️  DISCORD_WEBHOOK_URL not set');
  }
  if (!CONFIG.PIPEDRIVE_COMPANY_DOMAIN) {
    console.warn('⚠️  PIPEDRIVE_COMPANY_DOMAIN not set');
  }
});