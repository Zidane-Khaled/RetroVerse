const express = require('express');
const bodyParser = require('body-parser');
const { signup, login } = require('./services/login');
const { addFriend, getFriends } = require('./services/friendService');
const authMiddleware = require('./utils/authMiddleware');

const app = express();
app.use(bodyParser.json());

// Signup route
app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        const user = await signup(username, password, email);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await login(username, password);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add friend route
app.post('/friends', authMiddleware, async (req, res) => {
    const { friendId } = req.body;
    const userId = req.user.id;
    try {
        const result = await addFriend(userId, friendId);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get friends route
app.get('/friends', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        const friends = await getFriends(userId);
        res.status(200).json(friends);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = app;