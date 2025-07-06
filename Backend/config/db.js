import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '162.241.203.101',
  user: process.env.DB_USER || 'bluebyte_Gestobyte',
  password: process.env.DB_PASSWORD || 'gestobyte123',
  database: process.env.DB_NAME || 'bluebyte_GestoByte',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;