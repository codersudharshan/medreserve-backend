const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

// Detect SSL requirement (Render, Supabase, Neon, AWS RDS)
const enableSSL =
  !!connectionString &&
  /render|postgres|supabase|neon|amazonaws|cloud/.test(connectionString);

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: enableSSL ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'medreserve',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
    });

pool.on('error', (err) => {
  console.error('Unexpected idle client error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
