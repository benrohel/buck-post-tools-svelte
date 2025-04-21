// Simple Express proxy server to avoid CORS issues
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

// Enable CORS for all requests
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json());

// Proxy route for Anthropic API
app.post('/api/anthropic/messages', async (req, res) => {
  console.log('Received request to proxy to Anthropic');
  
  try {
    const url = 'https://api.anthropic.com/v1/messages';
    
    // Create headers for the forwarded request
    const headers = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    };
    
    // Forward the API key if present
    if (req.headers['x-api-key']) {
      headers['x-api-key'] = req.headers['x-api-key'];
    }
    
    console.log('Forwarding request to Anthropic with headers:', 
      JSON.stringify({ ...headers, 'x-api-key': '[REDACTED]' }));
    
    console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 200) + '...');
    
    if (!headers['x-api-key']) {
      console.log('WARNING: No API key found in request headers');
      return res.status(401).json({ error: 'API key is missing' });
    }
    
    // Forward the request to Anthropic
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(req.body)
    });
    
    console.log('Anthropic response status:', response.status);
    
    // If the response is not successful, log more details
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Anthropic API error', 
        status: response.status,
        details: errorText
      });
    }
    
    // Get the response as an array buffer (for stream support)
    const data = await response.buffer();
    
    // Copy response headers
    for (const [key, value] of Object.entries(response.headers.raw())) {
      try {
        res.setHeader(key, value);
      } catch (e) {
        console.warn(`Could not set header ${key}:`, e.message);
      }
    }
    
    // Send the response with the original status code
    res.status(response.status);
    res.send(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: `Proxy error: ${error.message}` });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
