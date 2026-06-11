import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import prisma from '../config/db';
import { generateQuestion, QuestionCategory } from '../services/questionEngine';

function todayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

const DAILY_CATEGORIES: QuestionCategory[] = [
  'General Knowledge',
  'Science & Technology',
  'Mathematics',
  'Sports',
  'Current Affairs & Fun Facts',
  'Information Technology',
  'AI Technology',
  'Mental Ability',
  'Puzzle',
  'General Knowledge',
];

export const dailyController = {
  async getToday(req: Request, res: Response) {
    try {
      const date = todayUTC();
      let challenge = await prisma.dailyChallenge.findUnique({ where: { date } });

      if (!challenge) {
        const questions = [];
        for (const cat of DAILY_CATEGORIES) {
          const q = await generateQuestion(cat, 'medium', 'en');
          questions.push(q);
        }
        challenge = await prisma.dailyChallenge.create({
          data: { date, questions: questions as any },
        });
      }

      return res.status(200).json({ date, questions: challenge.questions, totalQuestions: DAILY_CATEGORIES.length });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to get daily challenge' });
    }
  },

  async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const date = todayUTC();
      const entry = await prisma.dailyChallengeEntry.findUnique({
        where: { userId_date: { userId: user.id, date } },
      });
      return res.status(200).json({ date, played: !!entry, entry: entry || null });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to check status' });
    }
  },

  async submitScore(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const date = todayUTC();
      const { score, accuracy, avgResponseTime } = req.body;

      if (score === undefined || accuracy === undefined) {
        return res.status(400).json({ error: 'Missing score or accuracy' });
      }

      const existing = await prisma.dailyChallengeEntry.findUnique({
        where: { userId_date: { userId: user.id, date } },
      });
      if (existing) {
        return res.status(409).json({ error: 'Already submitted for today', entry: existing });
      }

      const entry = await prisma.dailyChallengeEntry.create({
        data: {
          userId: user.id,
          date,
          score: Number(score),
          accuracy: Number(accuracy),
          avgResponseTime: Number(avgResponseTime || 0),
        },
      });

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { coins: { increment: 15 }, xp: { increment: 30 } },
      });

      return res.status(200).json({ success: true, entry, coinsAwarded: 15, xpAwarded: 30, user: updatedUser });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to submit score' });
    }
  },

  async getLeaderboard(req: Request, res: Response) {
    try {
      const date = todayUTC();
      const entries = await prisma.dailyChallengeEntry.findMany({
        where: { date },
        orderBy: [{ score: 'desc' }, { avgResponseTime: 'asc' }],
        take: 20,
        include: { user: { select: { id: true, username: true, avatarUrl: true, level: true } } },
      });
      return res.status(200).json({ date, entries });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch leaderboard' });
    }
  },
};

export default dailyController;
