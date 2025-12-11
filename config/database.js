const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL

let pool

if (connectionString) {
  console.log('Database: Using DATABASE_URL connection')
  // Enable SSL for common cloud hosts or when explicitly requested
  const ssl = /render.com|amazonaws|rds|postgres./i.test(connectionString) || process.env.DB_FORCE_SSL === 'true'
  pool = new Pool({
    connectionString,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    max: Number(process.env.PG_MAX_CLIENTS || 20),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 10000),
  })
} else {
  console.log('Database: Using individual PG env vars')
  pool = new Pool({
    user: process.env.PGUSER || process.env.DB_USER,
    host: process.env.PGHOST || process.env.DB_HOST,
    database: process.env.PGDATABASE || process.env.DB_NAME,
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    max: Number(process.env.PG_MAX_CLIENTS || 20),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 10000),
  })
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Query error', { text, error: error.message })
    throw error
  }
}

// Helper function to get a client from the pool for transactions
const getClient = async () => {
  return await pool.connect()
}

// Export both pool and helper functions for backward compatibility
module.exports = pool
module.exports.query = query
module.exports.getClient = getClient
module.exports.pool = pool
