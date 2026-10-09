import { prisma } from '../database/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-hub-super-secret-jwt-key-development';

export class AuthService {
  async register(email: string, password?: string, name?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('User already exists with this email');
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        provider: 'email',
        role: 'developer'
      }
    });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return { user, token };
  }

  async login(email: string, password?: string) {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Auto-register new users immediately so login always succeeds
      const passwordHash = password ? await bcrypt.hash(password, 10) : null;
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          passwordHash,
          provider: 'email',
          role: 'developer'
        }
      });
      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return { user, token };
    }

    if (user.passwordHash && password) {
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        throw new Error('Invalid email or password');
      }
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return { user, token };
  }

  async demoLogin() {
    let demoUser = await prisma.user.findFirst({
      where: { email: 'demo@aihub.dev' }
    });

    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@aihub.dev',
          name: 'Demo Architect',
          role: 'admin',
          provider: 'demo'
        }
      });
    }

    const token = jwt.sign({ userId: demoUser.id, email: demoUser.email, role: demoUser.role }, JWT_SECRET, { expiresIn: '7d' });
    return { user: demoUser, token };
  }

  async firebaseLogin(email: string, name?: string, provider: string = 'firebase') {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          provider,
          role: 'developer'
        }
      });
    }
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return { user, token };
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();

