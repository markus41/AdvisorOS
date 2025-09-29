
const express = require('express');
const app = express();
app.use(express.json());

// QuickBooks mock endpoints
app.get('/api/quickbooks/auth/connect', (req, res) => {
  res.json({
    authUrl: 'https://mock-quickbooks-auth.example.com',
    state: 'mock-state-123'
  });
});

app.post('/api/quickbooks/auth/connect', (req, res) => {
  res.json({
    connected: false,
    token: null
  });
});

// Stripe mock endpoints
app.post('/api/stripe/create-checkout-session', (req, res) => {
  res.json({
    sessionId: 'cs_mock_123',
    url: 'https://checkout.stripe.com/mock'
  });
});

// Storage mock endpoints
app.post('/api/documents/upload', (req, res) => {
  res.json({
    id: 'mock-doc-123',
    name: 'mock-file.pdf',
    url: 'https://mock-storage.example.com/mock-file.pdf'
  });
});

// Email mock endpoints
app.post('/api/reports/email', (req, res) => {
  res.json({
    success: true,
    messageId: 'mock-email-123'
  });
});

// AI mock endpoints
app.post('/api/ai/analyze-document', (req, res) => {
  res.json({
    analysis: 'Mock document analysis result',
    confidence: 0.95
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log('Mock server running on port', PORT);
});
