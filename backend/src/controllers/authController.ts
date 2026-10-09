import { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../database/db.js';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication failed' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await authService.register(email, password, name);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
}

export async function demoLogin(req: Request, res: Response) {
  try {
    const result = await authService.demoLogin();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Demo login failed' });
  }
}

export async function firebaseAuth(req: Request, res: Response) {
  try {
    const { email, name, provider } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await authService.firebaseLogin(email, name, provider || 'firebase');
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'OAuth authentication failed' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, role: true, provider: true, avatarUrl: true, createdAt: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

