require('dotenv').config();
const { testConnection, query } = require('./src/utils/db');

async function test() {
    console.log('Testing database connection...');
    
    const connected = await testConnection();
    if (!connected) {
        console.log('Cannot connect. Make sure Docker is running: docker-compose up -d');
        process.exit(1);
    }
    
    // Test query - list all tables
    const tables = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    `);
    
    console.log('Tables in database:');
    tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
    });
    
    console.log('\nDatabase setup complete!');
    process.exit(0);
}

test();