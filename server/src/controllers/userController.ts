import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import prisma from '../config/db';

export const userController = {
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      
      const matchHistory = await prisma.matchHistory.findMany({
        where: { userId: user.id },
        orderBy: { playedAt: 'desc' },
        take: 20
      });

      const achievements = await prisma.userAchievement.findMany({
        where: { userId: user.id }
      });

      return res.status(200).json({
        user,
        matchHistory,
        achievements
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch profile." });
    }
  },

  async recordMatch(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { roomCode, gameMode, score, rank, accuracy, avgResponseTime } = req.body;

      if (!roomCode || !gameMode || score === undefined || rank === undefined) {
        return res.status(400).json({ error: "Missing required match parameter values." });
      }

      // Record match history
      const match = await prisma.matchHistory.create({
        data: {
          userId: user.id,
          roomCode,
          gameMode,
          score: Number(score),
          rank: Number(rank),
          accuracy: Number(accuracy || 0),
          avgResponseTime: Number(avgResponseTime || 0)
        }
      });

      // Calculate rewards:
      // Match completion: +20 XP, +10 Coins
      // Win (Rank 1): +50 XP, +50 Coins
      // Rank 2: +30 XP, +25 Coins
      // Rank 3: +25 XP, +15 Coins
      let xpAwarded = 20;
      let coinsAwarded = 10;
      const isWin = rank === 1;

      if (isWin) {
        xpAwarded += 50;
        coinsAwarded += 50;
      } else if (rank === 2) {
        xpAwarded += 30;
        coinsAwarded += 25;
      } else if (rank === 3) {
        xpAwarded += 25;
        coinsAwarded += 15;
      }

      const originalXp = user.xp;
      const originalLevel = user.level;
      const newXp = originalXp + xpAwarded;
      const newCoins = user.coins + coinsAwarded;
      
      // Level formula: level = 1 + floor(xp / 100)
      const newLevel = 1 + Math.floor(newXp / 100);
      const isLevelUp = newLevel > originalLevel;

      // Update User
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          xp: newXp,
          coins: newCoins,
          level: newLevel,
          wins: isWin ? user.wins + 1 : user.wins
        }
      });

      // Unlock achievements checklist
      const unlockedAchievements: string[] = [];
      const checkAndUnlock = async (type: string) => {
        try {
          const exists = await prisma.userAchievement.findFirst({
            where: { userId: user.id, achievementType: type }
          });
          if (!exists) {
            await prisma.userAchievement.create({
              data: { userId: user.id, achievementType: type }
            });
            unlockedAchievements.push(type);
          }
        } catch (e) {
          // Ignore unique constraint errors
        }
      };

      // 1. Check Win Achievements
      if (updatedUser.wins >= 1) {
        await checkAndUnlock("FIRST_WIN");
      }
      if (updatedUser.wins >= 10) {
        await checkAndUnlock("TEN_WINS");
      }
      if (updatedUser.wins >= 100) {
        await checkAndUnlock("HUNDRED_WINS");
      }

      // 2. Check Perfect Accuracy (100% correct answers in a match with at least 5 questions)
      if (accuracy === 100) {
        await checkAndUnlock("PERFECT_ACCURACY");
      }

      // 3. Check Fastest Finger (avg response time less than 1.5 seconds)
      if (accuracy > 70 && avgResponseTime > 0 && avgResponseTime < 1.8) {
        await checkAndUnlock("FASTEST_FINGER");
      }

      // 4. Check Quiz Master (Level 10 reached)
      if (newLevel >= 10) {
        await checkAndUnlock("QUIZ_MASTER");
      }

      return res.status(200).json({
        message: "Match recorded successfully.",
        xpAwarded,
        coinsAwarded,
        isLevelUp,
        newLevel,
        unlockedAchievements,
        user: updatedUser
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to record match." });
    }
  },

  async spendCoins(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const cost = Number(req.body.amount);
      if (!cost || cost <= 0) return res.status(400).json({ error: 'Invalid amount' });
      if (user.coins < cost) return res.status(400).json({ error: 'Not enough coins' });
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { coins: user.coins - cost }
      });
      return res.status(200).json({ success: true, user: updatedUser });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to spend coins' });
    }
  },

  // ── MCS helper (reused by both profile and leaderboard) ────────────────────
  // Mind Capability Score: 0–1000 from accuracy, speed, win rate, consistency, activity

  async getMindProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const matches = await prisma.matchHistory.findMany({
        where: { userId: user.id },
        orderBy: { playedAt: 'desc' },
        take: 50
      });

      if (matches.length === 0) {
        return res.status(200).json({
          mcs: 0, tier: 'ROOKIE', tierNext: 'APPRENTICE', tierNextAt: 100,
          archetype: 'NEWCOMER', archetypeEmoji: '🌱', archetypeDesc: 'Just getting started',
          analysis: 'Complete a few matches to unlock your cognitive profile and Mind Capability Score! Every battle adds to your mental map.',
          breakdown: { accuracy: 0, speed: 0, winRate: 0, consistency: 0, activity: 0 },
          totalMatches: 0, favoriteMode: 'classic', improving: false
        });
      }

      const totalMatches = matches.length;
      const avgAccuracy    = matches.reduce((s, m) => s + m.accuracy, 0) / totalMatches;
      const avgSpeed       = matches.reduce((s, m) => s + m.avgResponseTime, 0) / totalMatches;
      const winRate        = (matches.filter(m => m.rank === 1).length / totalMatches) * 100;
      const variance       = matches.reduce((s, m) => s + Math.pow(m.accuracy - avgAccuracy, 2), 0) / totalMatches;
      const stdDev         = Math.sqrt(variance);
      const consistency    = Math.max(0, 100 - stdDev);

      const recent5  = matches.slice(0, 5).reduce((s, m) => s + m.accuracy, 0) / Math.min(5, totalMatches);
      const earlier5 = matches.slice(-5).reduce((s, m) => s + m.accuracy, 0) / Math.min(5, totalMatches);
      const improving = totalMatches >= 10 && recent5 > earlier5 + 5;

      // Component scores
      const cAcc   = (avgAccuracy / 100) * 350;
      const cSpd   = Math.max(0, (5 - avgSpeed) / 5) * 250;
      const cWin   = (winRate / 100) * 200;
      const cCons  = (consistency / 100) * 150;
      const cAct   = (Math.min(totalMatches, 50) / 50) * 50;
      const mcs    = Math.min(1000, Math.round(cAcc + cSpd + cWin + cCons + cAct));

      const TIERS = [
        { name: 'GRANDMASTER', min: 850, next: null,         color: '#f59e0b' },
        { name: 'GENIUS',      min: 700, next: 'GRANDMASTER', nextAt: 850  },
        { name: 'EXPERT',      min: 550, next: 'GENIUS',      nextAt: 700  },
        { name: 'SCHOLAR',     min: 400, next: 'EXPERT',      nextAt: 550  },
        { name: 'CHALLENGER',  min: 250, next: 'SCHOLAR',     nextAt: 400  },
        { name: 'APPRENTICE',  min: 100, next: 'CHALLENGER',  nextAt: 250  },
        { name: 'ROOKIE',      min: 0,   next: 'APPRENTICE',  nextAt: 100  },
      ] as const;
      const tierObj = TIERS.find(t => mcs >= t.min) || TIERS[TIERS.length - 1];

      // Archetype
      const n = { acc: cAcc/350, spd: cSpd/250, win: cWin/200, cons: cCons/150 };
      let archetype: string, archetypeEmoji: string, archetypeDesc: string;
      if (improving)                                             { archetype = 'QUICK LEARNER';   archetypeEmoji = '📈'; archetypeDesc = 'Rapidly improving — unstoppable growth curve'; }
      else if (n.spd > 0.85 && n.spd > n.acc + 0.15)           { archetype = 'SPEED DEMON';      archetypeEmoji = '🚀'; archetypeDesc = 'Lightning reflexes — answers before others think'; }
      else if (n.acc > 0.85 && n.acc > n.spd + 0.1)            { archetype = 'SHARPSHOOTER';     archetypeEmoji = '🎯'; archetypeDesc = 'Precision over speed — near-perfect accuracy'; }
      else if (n.cons > 0.9 && stdDev < 10)                     { archetype = 'IRON WALL';        archetypeEmoji = '🛡️'; archetypeDesc = 'Unshakeable consistency — never cracks under pressure'; }
      else if (n.win > 0.8)                                     { archetype = 'BATTLE MACHINE';   archetypeEmoji = '⚔️'; archetypeDesc = 'Dominant competitor — wins when it counts most'; }
      else if (Math.abs(n.acc - n.spd) < 0.12 && mcs >= 500)   { archetype = 'BALANCED GENIUS';  archetypeEmoji = '⚡'; archetypeDesc = 'Perfect harmony of speed and accuracy'; }
      else                                                       { archetype = 'RISING CHALLENGER';archetypeEmoji = '🔥'; archetypeDesc = 'Hungry competitor — ascending to the top'; }

      const modeCounts: Record<string, number> = {};
      matches.forEach(m => { modeCounts[m.gameMode] = (modeCounts[m.gameMode] || 0) + 1; });
      const favoriteMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'classic';

      // Gemini cognitive analysis
      let analysis = `Your Mind Capability Score of ${mcs} puts you in the ${tierObj.name} tier. You show ${archetype.toLowerCase()} tendencies across ${totalMatches} battles. Keep competing to unlock deeper insights!`;
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey?.trim()) {
        try {
          const prompt = `Quiz player stats — MCS: ${mcs}/1000, Tier: ${tierObj.name}, Archetype: ${archetype}, Accuracy: ${Math.round(avgAccuracy)}%, Avg Response: ${avgSpeed.toFixed(1)}s, Win Rate: ${Math.round(winRate)}%, Consistency: ${Math.round(consistency)}%, Total Matches: ${totalMatches}, Favorite Mode: ${favoriteMode}, Improving: ${improving}.

Write a 3-sentence cognitive analysis. Be specific to the numbers. Tone: encouraging but competitive gaming style. Mention 1 strength and 1 area to improve. No bullets. Under 75 words.`;
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 130, temperature: 0.75 } })
          });
          if (r.ok) {
            const d = await r.json() as any;
            const t = d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (t) analysis = t;
          }
        } catch { /* fallback */ }
      }

      return res.status(200).json({
        mcs, tier: tierObj.name,
        tierNext: (tierObj as any).next ?? null, tierNextAt: (tierObj as any).nextAt ?? null,
        archetype, archetypeEmoji, archetypeDesc, analysis,
        breakdown: {
          accuracy: Math.round(avgAccuracy), speed: parseFloat(avgSpeed.toFixed(2)),
          winRate: Math.round(winRate), consistency: Math.round(consistency), activity: totalMatches
        },
        totalMatches, favoriteMode, improving
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to generate mind profile' });
    }
  },

  async getMindLeaderboard(_req: AuthenticatedRequest, res: Response) {
    try {
      const topUsers = await prisma.user.findMany({
        orderBy: { xp: 'desc' }, take: 15,
        select: { id: true, username: true, avatarUrl: true, level: true, wins: true }
      });

      const results = await Promise.all(topUsers.map(async (u) => {
        const matches = await prisma.matchHistory.findMany({ where: { userId: u.id }, take: 30 });
        if (!matches.length) return { ...u, mcs: 0, tier: 'ROOKIE', totalMatches: 0 };
        const n = matches.length;
        const avgAcc  = matches.reduce((s, m) => s + m.accuracy, 0) / n;
        const avgSpd  = matches.reduce((s, m) => s + m.avgResponseTime, 0) / n;
        const wr      = (matches.filter(m => m.rank === 1).length / n) * 100;
        const stdDev  = Math.sqrt(matches.reduce((s, m) => s + Math.pow(m.accuracy - avgAcc, 2), 0) / n);
        const mcs     = Math.min(1000, Math.round(
          (avgAcc/100)*350 + Math.max(0,(5-avgSpd)/5)*250 + (wr/100)*200 + (Math.max(0,100-stdDev)/100)*150 + (Math.min(n,50)/50)*50
        ));
        const tier = mcs>=850?'GRANDMASTER':mcs>=700?'GENIUS':mcs>=550?'EXPERT':mcs>=400?'SCHOLAR':mcs>=250?'CHALLENGER':mcs>=100?'APPRENTICE':'ROOKIE';
        return { ...u, mcs, tier, totalMatches: n };
      }));

      results.sort((a, b) => b.mcs - a.mcs);
      return res.status(200).json(results);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch mind leaderboard' });
    }
  },

  async getLeaderboard(req: AuthenticatedRequest, res: Response) {
    try {
      const topCoins = await prisma.user.findMany({
        orderBy: { coins: 'desc' },
        take: 10,
        select: { id: true, username: true, avatarUrl: true, coins: true, level: true, wins: true }
      });

      const topWins = await prisma.user.findMany({
        orderBy: { wins: 'desc' },
        take: 10,
        select: { id: true, username: true, avatarUrl: true, coins: true, level: true, wins: true }
      });

      return res.status(200).json({
        topCoins,
        topWins
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch leaderboard." });
    }
  }
};
export default userController;
