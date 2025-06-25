const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Token caching
let cachedToken = null;
let tokenExpiry = null;

// Get Prokerala Access Token
async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.PROKERALA_CLIENT_ID);
  params.append('client_secret', process.env.PROKERALA_CLIENT_SECRET);

  const response = await axios.post('https://api.prokerala.com/token', params);
  cachedToken = response.data.access_token;
  tokenExpiry = now + response.data.expires_in * 1000;

  return cachedToken;
}

// POST /natal-chart – fetch Western natal chart
app.post('/natal-chart', async (req, res) => {
  const { datetime, coordinates } = req.body;

  try {
    const accessToken = await getAccessToken();
    const [lat, lon] = coordinates.split(',');

    const response = await axios.get('https://api.prokerala.com/v2/astrology/chart', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        datetime,
        latitude: lat.trim(),
        longitude: lon.trim(),
        system: 'western',
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(3000, () => {
  console.log('✅ Server running on http://localhost:3000');
});

