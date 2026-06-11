import { Router } from 'express';
import userController from '../controllers/userController';
import authenticate from '../middlewares/authMiddleware';

const router = Router();

router.get('/profile', authenticate, userController.getProfile);
router.post('/match', authenticate, userController.recordMatch);
router.post('/spend-coins', authenticate, userController.spendCoins);
router.get('/mind-profile', authenticate, userController.getMindProfile);
router.get('/mind-leaderboard', userController.getMindLeaderboard);
router.get('/leaderboard', userController.getLeaderboard);

export default router;
