const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query } = require('../utils/db');
const { generateResetToken, sendPasswordResetEmail } = require('../services/emailService');

// Generate JWT token
const generateToken = (userId, email) => {
    return jwt.sign(
        { id: userId, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// User Registration
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if user exists
        const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const result = await query(
            `INSERT INTO users (email, password_hash, name, provider, email_verified)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, created_at`,
            [email, hashedPassword, name, 'email', false]
        );
        
        const user = result.rows[0];
        const token = generateToken(user.id, user.email);
        
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// User Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        // Find user
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        
        // Check password but for email providers
        if (user.provider === 'google') {
            return res.status(401).json({ error: 'Please login with Google' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = generateToken(user.id, user.email);
        
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url
            },
            token
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get current user (from JWT)
const getMe = async (req, res) => {
    try {
        const user = await query(
            'SELECT id, email, name, avatar_url, provider, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({ user: user.rows[0] });
        
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update profile
const updateProfile = async (req, res) => {
    try {
        const { name, avatar_url } = req.body;
        const userId = req.user.id;
        
        const result = await query(
            'UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, email, name, avatar_url',
            [name, avatar_url, userId]
        );
        
        res.status(200).json({
            message: 'Profile updated',
            user: result.rows[0]
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Request password reset
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(200).json({ message: 'If email exists, reset link sent' });
        }
        
        const user = userResult.rows[0];
        
        // Generate token
        const token = generateResetToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
        
        // Save token to database
        await query(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, token, expiresAt]
        );
        
        // Send email
        await sendPasswordResetEmail(email, token, user.name);
        
        res.status(200).json({ message: 'If email exists, reset link sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Reset password with token
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Find valid token
        const tokenResult = await query(
            'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
            [token]
        );
        
        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        
        const resetToken = tokenResult.rows[0];
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update user password
        await query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, resetToken.user_id]
        );
        
        // Mark token as used
        await query(
            'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
            [resetToken.id]
        );
        
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    forgotPassword,
    resetPassword
};