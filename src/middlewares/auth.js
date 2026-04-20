import { verifyToken } from '../utils/jwt.js';


export const jwtAuth = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ message: 'Akses Ditolak. Token tidak ditemukan.' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);

  if (!user) {
    return c.json({ message: 'Token tidak valid atau sudah kedaluwarsa.' }, 401);
  }


  c.set('user', user);
  await next();
};

export const isPremium = async (c, next) => {
  const user = c.get('user');

  if (user.role !== 'premium' && user.role !== 'admin') {
    return c.json({ 
      message: 'Fitur Premium. Silakan upgrade akun Anda untuk menggunakan fitur ini.' 
    }, 403);
  }

  await next();
};