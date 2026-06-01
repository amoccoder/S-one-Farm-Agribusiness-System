const { Client } = require('pg');
require('dotenv').config();

const checkTables = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    console.log('Successfully connected to the database.');
    console.log('Checking for tables...');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\nTables found in database:');
    const tableNames = res.rows.map(row => row.table_name);
    tableNames.forEach(name => console.log(`- ${name}`));

    const requiredTables = ['flocks', 'daily_egg_production', 'poultry_feed_records', 'poultry_mortality', 'poultry_vaccinations'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));

    if (missingTables.length === 0) {
        console.log('\nSUCCESS: All poultry tables were found.');
    } else {
        console.error(`\nERROR: Missing poultry tables: ${missingTables.join(', ')}`);
    }

  } catch (err) {
    console.error('\nFailed to connect or query the database:', err.message);
  } finally {
    await client.end();
  }
};

checkTables();