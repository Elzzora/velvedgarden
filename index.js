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
        return next(err);
    }
    next();
};

const isAuthenticated = (req, res, next) => {
    if (!req.user) return res.redirect('/login');
    next();
};

const isAuthenticatedJson = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 401 });
    next();
};

app.get('/api/guilds', async (_, res) => {
    try {
        const [guildResponse, channelsResponse] = await Promise.all([
            axios.get(`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}?with_counts=true`, { headers: { 'Authorization': `Bot ${process.env.TOKEN}` }}),
            axios.get(`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/channels`, { headers: { 'Authorization': `Bot ${process.env.TOKEN}` }})
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

app.get('/api/ratings', async (req, res) => {
    try {
        const [ratingData] = await db.query('SELECT * FROM `rating` WHERE `server` = ?', [process.env.GUILD_ID]);
        const rating = ratingData.length > 0 ? ratingData[0] : null;
        if (!rating) return res.status(404).json({ message: 'Not Found', code: 404 });
        
        let totalUser = 0;
        let totalRating = 0;

        for (let key in rating) {
            if (key === 'server') continue;
            const count = rating[key];
            if (count) {
                totalUser += count;
                totalRating += count * key;
            }
        }
        return res.status(200).json({
            averageRating: totalUser > 0 ? (totalRating / totalUser).toFixed(2) : 0,
            totalUser: totalUser,
            ratings: {
                5: rating[5] || 0,
                4: rating[4] || 0,
                3: rating[3] || 0,
                2: rating[2] || 0,
                1: rating[1] || 0
            }
        });
    } catch (err) {
        handleError(res, err);
    }
});

app.post('/submit/:type', fetchUserData, isAuthenticatedJson, async (req, res) => {
    const data = req.body;
    const type = req.params?.type;
    const user = req.user;
    try {
        if (type === 'recruitments') {
            const embed = new EmbedBuilder()
                .setTitle('New Form Submission')
                .addFields(
                    { name: 'Username', value: `[@${user.user_username || 'N/A'}](https://discord.com/users/${user.user_id})` },
                    { name: 'Discord ID', value: user.user_id || 'N/A' },
                    { name: 'Position', value: data.position?.toUpperCase() || 'N/A' },
                    { name: 'Reason', value: data.reason || 'N/A' },
                    { name: 'Experience', value: data.experience || 'N/A' }
                )
                .setThumbnail(user.user_avatar
                    ? `https://cdn.discordapp.com/avatars/${user.user_id}/${user.user_avatar}.png?size=4096`
                    : `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`)
                .setTimestamp()
                .setColor('Green');
            
            const webhook = new WebhookClient({ url: process.env.WEBHOOK });
            await webhook.send({ embeds: [embed] });
        } else if (type === 'feedback') {
            const embed = new EmbedBuilder()
                .setTitle(`@${user.user_username}`)
                .setAuthor({
                    name: 'New Rating Submitted By:',
                    iconURL: 'https://velvedgarden.vercel.app/images/VGdiscord.png'
                })
                .addFields(
                    { name: 'Rating', value: data?.rating?.replace('5', '⭐⭐⭐⭐⭐').replace('4', '⭐⭐⭐⭐').replace('3', '⭐⭐⭐').replace('2', '⭐⭐').replace('1', '⭐') || 'N/A' },
                    { name: 'Reason', value: data?.reason || 'N/A' },
                    { name: 'Suggestion', value: data?.suggestion || 'N/A' }
                )
                .setThumbnail(user.user_avatar
                    ? `https://cdn.discordapp.com/avatars/${user.user_id}/${user.user_avatar}.png?size=4096`
                    : `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`)
                .setTimestamp()
                .setColor('Yellow');

            const webhook = new WebhookClient({ url: process.env.WEBHOOK_FEEDBACK });
            await webhook.send({ embeds: [embed] });
            await db.query('INSERT INTO `rating` (`server`, `5`, `4`, `3`, `2`, `1`) VALUES (?, 0, 0, 0, 0, 0) ON DUPLICATE KEY UPDATE `5` = 5 + CASE WHEN ? = 5 THEN 1 ELSE 0 END, `4` = 4 + CASE WHEN ? = 4 THEN 1 ELSE 0 END, `3` = 3 + CASE WHEN ? = 3 THEN 1 ELSE 0 END, `2` = 2 + CASE WHEN ? = 2 THEN 1 ELSE 0 END, `1` = 1 + CASE WHEN ? = 1 THEN 1 ELSE 0 END',
            [process.env.GUILD_ID, data?.rating, data?.rating, data?.rating, data?.rating, data?.rating]);
        }
        res.status(200).json({ message: 'OK', code: 200 });
    } catch (err) {
        handleError(res, err);
    }
});

app.all('/recruitments', fetchUserData, isAuthenticated, (_, res) => res.sendFile(path.join(__dirname, 'pages', 'recruitments.html')));
app.all('/feedback', fetchUserData, isAuthenticated, (_, res) => res.sendFile(path.join(__dirname, 'pages', 'feedback.html')));
app.all('/profile', fetchUserData, isAuthenticated, (_, res) => res.sendFile(path.join(__dirname, 'pages', 'profile.html')));

app.all('/auth/discord', (_, res) => {
    res.clearCookie('user_id');
    res.redirect(process.env.AUTH_URL);
});

app.get('/api/profile', fetchUserData, isAuthenticatedJson, async (req, res) => {
    res.status(200).json({
        name: req.user?.user_username,
        avatar: req.user?.user_avatar
            ? `https://cdn.discordapp.com/avatars/${req.user.user_id}/${req.user.user_avatar}.png?size=4096`
            : `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`
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
        return res.redirect('/profile');
    } catch (err) {
        handleError(res, err);
        res.redirect('/login');
    }
});

const pages = [
    '/',
    '/images',
    '/partners',
    '/logout',
    '/login'
];

pages.forEach(page => {
    app.all(page, async (req, res) => {
        if (page === '/logout') {
            res.clearCookie('user_id');
            res.redirect('/login');
            return;
        }
        if (page === '/login') {
            if (req.cookies?.user_id) return res.redirect('/profile');
            res.sendFile(path.join(__dirname, 'pages', 'login.html'));
            return;
        }
        res.sendFile(path.join(__dirname, 'pages', page === '/' ? 'index.html' : `${page.substring(1)}.html`));
    });
});

app.use((err, req, res, next) => res.status(err.status || 500).json({ message: 'Internal Server Error', code: 500, error: err.message || 'Unknown Error' }));
app.use((_, res) => res.sendFile(path.join(__dirname, 'pages', '404.html')));
app.listen(process.env.PORT);
