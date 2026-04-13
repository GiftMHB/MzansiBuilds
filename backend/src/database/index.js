// databse connection
const { pool, query, testConnection } = require('../utils/db');

// Initialize database, run migrations
const initDatabase = async () => {
    console.log('Initializing database...');
    
    const connected = await testConnection();
    if (!connected) {
        throw new Error('Failed to connect to database');
    }
    
    // Check if users table exists 
    const result = await query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'users'
        );
    `);
    
    if (result.rows[0].exists) {
        console.log('Database schema already exists');
    } else {
        console.log('No tables found. Run docker-compose up --build to run migrations');
    }
    
    return true;
};

// Close database connection pool
const closeDatabase = async () => {
    await pool.end();
    console.log('Database connection closed');
};

module.exports = {
    initDatabase,
    closeDatabase,
    query,
    pool
};