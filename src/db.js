require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: +process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const pool = mysql.createPool({ ...config, database: process.env.DB_NAME, connectionLimit: 10 });
module.exports = { pool, config };
