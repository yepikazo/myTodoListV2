import { Hono } from 'hono';
import { db } from '../db.js';
import { generateToken } from '../utils/jwt.js';

export const authRoutes = new Hono();


const GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback';


authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];

  if (!user || user.password !== password) {
    return c.json({ message: 'Email atau password salah' }, 401);
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  return c.json({ token, role: user.role, email: user.email });
});


authRoutes.post('/register', async (c) => {
  const { email, password } = await c.req.json();
  try {
    await db.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, password, 'user']
    );
    return c.json({ message: 'Registrasi berhasil, silakan login.' }, 201);
  } catch (error) {
    return c.json({ message: 'Email sudah terdaftar atau terjadi kesalahan.' }, 400);
  }
});

authRoutes.get('/google', (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const scope = 'openid email profile';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=${scope}`;
  
  return c.redirect(authUrl);
});

// CALLBACK DARI GOOGLE (Menangani hasil login)
authRoutes.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) return c.json({ message: 'Code OAuth tidak ditemukan dari Google' }, 400);

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI, 
        grant_type: 'authorization_code',
      }),
    });
    
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
        return c.json({ message: 'Gagal ambil token dari Google', detail: tokenData }, 400);
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();
    
    if (!googleUser.email) return c.json({ message: 'Gagal mendapatkan email dari Google' }, 400);
    
    const email = googleUser.email;

    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    let dbUser = rows[0];

    if (!dbUser) {
      const [result] = await db.execute(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, 'oauth-user', 'user']
      );
      dbUser = { id: result.insertId, email, role: 'user' };
    }

    const token = generateToken({ id: dbUser.id, email: dbUser.email, role: dbUser.role });
    return c.redirect(`/?token=${token}`);
    
  } catch (error) {
    return c.json({ message: 'Terjadi kesalahan sistem saat otentikasi Google' }, 500);
  }
});