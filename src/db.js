import mysql from 'mysql2/promise';

// Membuat pool koneksi agar lebih efisien untuk banyak requestz
export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'db_todolist',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});