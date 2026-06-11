import { Router } from 'express';
import adminController from '../controllers/adminController';

const router = Router();

// Exposed directly for ease of verification and testing.
router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser);

export default router;
