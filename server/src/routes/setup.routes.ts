import { Router } from 'express';
import { SetupController } from '../controllers/setup.controller';

const router = Router();
const controller = new SetupController();

router.get('/status', controller.getStatus);
router.post('/', controller.setup);

export default router;
