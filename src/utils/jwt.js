import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret123';

// Generate Token
export function generateToken(payload) {
  return jwt.sign(payload, SECRET, {
    expiresIn: '24h', // Token berlaku 24 jam
  });
}

// Verify Token
export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}