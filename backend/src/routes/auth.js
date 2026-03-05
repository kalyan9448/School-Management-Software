const express = require('express');
const router = express.Router();

// Mock Auth Router

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Mock login check
        if (password === 'demo123') {
            res.json({
                user: { id: '1', email, name: 'Admin User', role: 'admin' },
                session: { access_token: 'mock-token' }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out' });
});

// GET /api/auth/profile
router.get('/profile', (req, res) => {
    res.json({ message: 'Get current user profile' });
});

module.exports = router;
