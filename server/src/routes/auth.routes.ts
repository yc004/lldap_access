import { Router } from 'express';
import { login, verify2fa } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/2fa/verify', verify2fa);

export default router;
