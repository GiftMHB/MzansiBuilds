const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Secure by design - middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'MzansiBuilds API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes will be added here
// app.use('/api/auth', authRoutes);
// app.use('/api/projects', projectRoutes);

module.exports = app;