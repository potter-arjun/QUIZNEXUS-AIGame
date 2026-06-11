import { Router } from 'express';
import { dailyController } from '../controllers/dailyController';
import authenticate from '../middlewares/authMiddleware';

const router = Router();

router.get('/today', dailyController.getToday);
router.get('/leaderboard', dailyController.getLeaderboard);
router.get('/status', authenticate, dailyController.getStatus);
router.post('/submit', authenticate, dailyController.submitScore);

export default router;
