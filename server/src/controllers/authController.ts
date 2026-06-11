import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev-navodaya-quiz';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password, avatarUrl } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required registration parameters." });
      }

      // Check if username or email exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: "Username or Email is already taken." });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const chosenAvatar = avatarUrl || `avatar_${Math.floor(Math.random() * 8) + 1}`;

      const user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          avatarUrl: chosenAvatar,
          coins: 100, // starting coins
          xp: 0,
          level: 1,
          wins: 0
        }
      });

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          coins: user.coins,
          xp: user.xp,
          level: user.level,
          wins: user.wins
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Registration failed." });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.passwordHash) {
        return res.status(400).json({ error: "Invalid email or password." });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid email or password." });
      }

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          coins: user.coins,
          xp: user.xp,
          level: user.level,
          wins: user.wins
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Login failed." });
    }
  },

  async guest(req: Request, res: Response) {
    try {
      const { username, avatarUrl } = req.body;
      const guestName = username ? `${username.trim().substring(0, 12)} (Guest)` : `Guest_${Math.floor(Math.random() * 8999) + 1000}`;
      const chosenAvatar = avatarUrl || `avatar_${Math.floor(Math.random() * 8) + 1}`;

      // Create a guest record in database
      const user = await prisma.user.create({
        data: {
          username: guestName,
          avatarUrl: chosenAvatar,
          coins: 0,
          xp: 0,
          level: 1,
          wins: 0
        }
      });

      const token = jwt.sign({ userId: user.id, username: user.username, isGuest: true }, JWT_SECRET, { expiresIn: '1d' });

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          coins: user.coins,
          xp: user.xp,
          level: user.level,
          wins: user.wins
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Guest signup failed." });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      // Always respond with the same message — avoids email enumeration
      if (!user || !user.passwordHash) {
        return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetExpiry: expiry }
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const resetUrl = `${clientUrl}/reset-password?token=${token}`;
      console.log(`[AUTH] Password reset link for ${email}: ${resetUrl}`);

      return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Something went wrong.' });
    }
  },

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    try {
      const user = await prisma.user.findFirst({
        where: { resetToken: token, resetExpiry: { gt: new Date() } }
      });

      if (!user) return res.status(400).json({ error: 'Invalid or expired reset link.' });

      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, resetToken: null, resetExpiry: null }
      });

      return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Reset failed.' });
    }
  }
};
export default authController;
