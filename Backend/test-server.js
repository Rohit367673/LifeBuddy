const express = require('express');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(express.json());

// Import n8n routes
const n8nRoutes = require('./routes/n8nRoutes');

// Register routes
app.use('/api/n8n', n8nRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Test LifeBuddy Backend API' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`N8N_API_KEY present: ${!!process.env.N8N_API_KEY}`);
});
