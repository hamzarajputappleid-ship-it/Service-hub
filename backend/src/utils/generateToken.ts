import jwt from 'jsonwebtoken';

export const generateToken = (userId: string, role: string) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
  
  return jwt.sign(
    { id: userId, role },
    secret,
    { expiresIn: '30d' }
  );
};
