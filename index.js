const express = require('express');
const path = require('path');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const { WebhookClient, EmbedBuilder } = require('discord.js');
const bodyParser = require('body-parser');
const { createPool } = require('mysql2/promise');
require('dotenv').config();

const app = express();
const db = createPool(process.env.DATABASE);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(express.static(path.join(__dirname, 'public')));

const handleError = (res, err) => {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error', code: 500 });
};

const fetchUserData = async (req, res, next) => {
    const userId = req.cookies.user_id;
    if (!userId) return next();

    try {
        const [userData] = await db.query('SELECT * FROM `discord` WHERE `user_id` = ?', [userId]);
        req.user = userData.length > 0 ? userData[0] : null;
    } catch (err) {
        console.error(err);
    }
    next();
};

app.get('/guilds', async (_, res) => {
    try {
        const [guildResponse, channelsResponse] = await Promise.all([
            axios.get(`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}?with_counts=true`, {
                headers: { 'Authorization': `Bot ${process.env.TOKEN}` }
            }),
            axios.get(`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/channels`, {
                headers: { 'Authorization': `Bot ${process.env.TOKEN}` }
            }),
        ]);

        res.json({
            channels: channelsResponse.data.length,
            members: guildResponse.data.approximate_member_count,
            actives: guildResponse.data.approximate_presence_count
        });
    } catch (err) {
        handleError(res, err);
    }
});

app.post('/submit', fetchUserData, async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized', code: 401 });
        
        const data = req.body;
        const webhook = new WebhookClient({ url: process.env.WEBHOOK });

        const embed = new EmbedBuilder()
            .setTitle('New Form Submission')
            .addFields(
                { name: 'Username', value: `**[${user.user_username || 'N/A'}](https://discord.com/users/${user.user_id})**` },
                { name: 'Discord ID', value: `**${user.user_id || 'N/A'}**` },
                { name: 'Position', value: `**${data?.position?.toUpperCase() || 'N/A'}**` },
                { name: 'Reason', value: data?.reason || 'N/A' },
                { name: 'Experience', value: data?.experience || 'N/A' }
            )
            .setThumbnail(user.user_avatar
                ? `https://cdn.discordapp.com/avatars/${user.user_id}/${user.user_avatar}`
                : `https://cdn.discordapp.com/embed/avatars/0.png`)
            .setTimestamp()
            .setColor('Green');

        await webhook.send({ embeds: [embed] });
        res.status(200).json({ message: 'OK', code: 200 });
    } catch (err) {
        handleError(res, err);
    }
});

app.all('/recruitments', fetchUserData, (req, res) => {
    if (!req.user) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'pages', 'recruitments.html'));
});

app.all('/auth/discord', (req, res) => {
    res.clearCookie('user_id');
    res.redirect(process.env.AUTH_URL);
});

app.get('/profile', fetchUserData, async (req, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized', code: 401 });

    res.status(200).json({
        name: user.user_username,
        avatar: user.user_avatar
            ? `https://cdn.discordapp.com/avatars/${user.user_id}/${user.user_avatar}`
            : `https://cdn.discordapp.com/embed/avatars/0.png`
    });
});

app.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).redirect('/login');

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.REDIRECT_URI,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: { 'Authorization': `Bearer ${tokenResponse.data.access_token}` }
        });

        const { id, avatar, email, username } = userResponse.data;
        await axios.put(`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/members/${id}`, { access_token: tokenResponse.data.access_token }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bot ${process.env.TOKEN}`
            }
        });

        await db.query('INSERT INTO `discord` (`user_id`, `user_avatar`, `user_email`, `user_username`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `user_avatar` = ?, `user_email` = ?, `user_username` = ?', 
        [id, avatar, email, username, avatar, email, username]);

        res.cookie('user_id', id, { maxAge: 3600000, httpOnly: true, secure: true });
        return res.redirect('/recruitments');
    } catch (err) {
        console.error('Error fetching user data:', err.response?.data || err.message);
        handleError(res, err);
        res.redirect('/login');
    }
});

// ❗ KALO MAU NAMBAH PAGES, TAMBAH DISINI AJA ❗
const pages = ['/', '/images', '/partners', '/logout', '/login'];

pages.forEach(page => {
    app.all(page, async (req, res) => {
        if (page === '/logout') {
            res.clearCookie('user_id');
            res.redirect('/login');
            return;
        }
        res.sendFile(path.join(__dirname, 'pages', page === '/' ? 'index.html' : `${page.substring(1)}.html`));
    });
});

app.use((_, res) => res.sendFile(path.join(__dirname, 'pages', '404.html')));
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
