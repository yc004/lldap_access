import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/password', userController.changePassword);
router.post('/2fa/setup', userController.setup2fa);
router.post('/2fa/enable', userController.enable2fa);
router.get('/logs', userController.getLogs);

export default router;
