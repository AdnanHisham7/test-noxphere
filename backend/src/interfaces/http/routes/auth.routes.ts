// src/interfaces/http/routes/auth.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

export const authRouter = Router();

// These will be bound to controller instances in the DI container
// Kept as placeholders here
authRouter.post('/register', (req, res, next) => {
  (req.app.locals.controllers.auth as any).register(req, res, next);
});
authRouter.post('/login', (req, res, next) => {
  (req.app.locals.controllers.auth as any).login(req, res, next);
});
authRouter.post('/refresh', (req, res, next) => {
  (req.app.locals.controllers.auth as any).refreshToken(req, res, next);
});
authRouter.post('/logout', authenticate, (req, res, next) => {
  (req.app.locals.controllers.auth as any).logout(req, res, next);
});
authRouter.post('/change-password', authenticate, (req, res, next) => {
  (req.app.locals.controllers.auth as any).changePassword(req, res, next);
});
authRouter.get('/me', authenticate, (req, res, next) => {
  (req.app.locals.controllers.auth as any).me(req, res, next);
});