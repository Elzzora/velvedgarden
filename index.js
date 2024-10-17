const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();

app.use(express.static(path.join(__dirname, 'scripts')));
app.use(express.static(path.join(__dirname, 'pages')));

app.get('/info', async (req, res) => {
  const response1 = await fetch(`https://discord.com/api/v10/guilds/${process.env.GUILDID}?with_counts=true`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${process.env.TOKEN}`
    }
  });

  const response2 = await fetch(`https://discord.com/api/v10/guilds/${process.env.GUILDID}/channels`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${process.env.TOKEN}`
    }
  });

  const responseData = await response1.json();
  const channelData = await response2.json();
  return res.json({
    channels: channelData?.length,
    members: responseData.approximate_member_count,
    actives: responseData.approximate_presence_count
  });
});

app.get('/', (req, res) => {
  return res.sendFile(path.join(__dirname, 'pages/index.html'));
});

app.get('/images', (req, res) => {
  return res.sendFile(path.join(__dirname, 'pages/images.html'));
});

app.use((req, res) => {
  return res.sendFile(path.join(__dirname, 'pages/404.html'));
});

app.listen(process.env.PORT);
