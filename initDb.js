const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

if (!process.env.DB_PASSWORD) {
  console.error(`\nError: DB_PASSWORD is missing.\nPlease ensure you have created a '.env' file at:\n${envPath}\nand that it contains DB_PASSWORD=your_password\n`);
  process.exit(1);
}

const createDb = async () => {
  // Connect to default 'postgres' database to check/create the new one
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_DATABASE}'`);
    if (res.rowCount === 0) {
      console.log(`Creating database "${process.env.DB_DATABASE}"...`);
      await client.query(`CREATE DATABASE "${process.env.DB_DATABASE}"`);
      console.log('Database created.');
    } else {
      console.log(`Database "${process.env.DB_DATABASE}" already exists.`);
    }
  } catch (err) {
    console.error('Error checking/creating database:', err);
  } finally {
    await client.end();
  }
};

const runSchema = async () => {
  // Connect to the actual project database
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    console.log('Running schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('Schema executed successfully.');
  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    await client.end();
  }
};

(async () => {
  await createDb();
  await runSchema();
})();