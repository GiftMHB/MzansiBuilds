const { Pool } = require('pg');
require('dotenv').config();


const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ,
    database: process.env.DB_NAME,
    max: 20, // Maximum number of clients in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Database connected successfully');
        client.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        return false;
    }
};

// Query helper with logging (for development)
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV === 'development') {
            console.log('Query:', { text: text.substring(0, 100), duration, rows: res.rowCount });
        }
        return res;
    } catch (error) {
        console.error('Query error:', { text: text.substring(0, 100), error: error.message });
        throw error;
    }
};

module.exports = {
    pool,
    query,
    testConnection
};