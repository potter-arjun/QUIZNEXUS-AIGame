import { Request, Response } from 'express';
import prisma from '../config/db';
import { gameService } from '../services/gameService';

export const adminController = {
  async getDashboardStats(req: Request, res: Response) {
    try {
      const usersCount = await prisma.user.count();
      const matchesCount = await prisma.matchHistory.count();
      
      // Calculate average match accuracy
      const avgAccuracyData = await prisma.matchHistory.aggregate({
        _avg: {
          accuracy: true,
          avgResponseTime: true
        }
      });

      // Get count of currently active in-memory rooms
      const activeRooms = gameService.getAllPublicRooms();
      const activeRoomsCount = activeRooms.length;

      // Mock Analytics Dashboard values
      const dailyActiveUsers = Math.max(usersCount, 1) * 3 + 2; // Simulated DAU
      
      const popularCategories = [
        { category: "Mental Ability", share: 40 },
        { category: "Figure Reasoning", share: 25 },
        { category: "Mathematics", share: 20 },
        { category: "General Knowledge", share: 15 }
      ];

      return res.status(200).json({
        usersCount,
        matchesCount,
        averageAccuracy: avgAccuracyData._avg.accuracy || 82.5,
        averageResponseTime: avgAccuracyData._avg.avgResponseTime || 4.2,
        activeRoomsCount,
        dailyActiveUsers,
        popularCategories
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch admin dashboard statistics." });
    }
  },

  async listUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, username: true, email: true, coins: true, xp: true, level: true, wins: true, createdAt: true }
      });
      return res.status(200).json(users);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to list users." });
    }
  },

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.user.delete({
        where: { id }
      });
      return res.status(200).json({ message: "User deleted successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to delete user." });
    }
  }
};
export default adminController;
