const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry && now < tokenExpiry) return cachedToken;

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.PROKERALA_CLIENT_ID);
  params.append('client_secret', process.env.PROKERALA_CLIENT_SECRET);

  const response = await axios.post('https://api.prokerala.com/token', params);
  cachedToken = response.data.access_token;
  tokenExpiry = now + response.data.expires_in * 1000;

  return cachedToken;
}

app.post('/natal-chart', async (req, res) => {
  const { datetime, coordinates } = req.body;
  if (!datetime || !coordinates) {
    return res.status(400).json({ error: 'Missing datetime or coordinates' });
  }

  try {
    const token = await getAccessToken();
    const [latitude, longitude] = coordinates.split(',');

    const response = await axios.get('https://api.prokerala.com/v2/astrology/natal-chart', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        datetime,
        latitude,
        longitude,
        system: 'western',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Prokerala error:', error.response?.data || error.message);
    const message = error.response?.data?.message || error.message || 'Unknown error';
    res.status(500).json({ error: message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔮 AstroAura API running on port ${PORT}`));
