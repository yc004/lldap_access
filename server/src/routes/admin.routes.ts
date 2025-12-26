import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import * as adminController from '../controllers/admin.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.put('/users/:uid', adminController.updateUser);
router.delete('/users/:uid', adminController.deleteUser);
router.post('/users/import', upload.single('file'), adminController.importUsers);

export default router;
