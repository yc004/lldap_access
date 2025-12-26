import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Login failed' });
  }
};

export const verify2fa = async (req: Request, res: Response) => {
  try {
    const { tempToken, code } = req.body;
    const result = await authService.verify2faLogin(tempToken, code);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Verification failed' });
  }
};
