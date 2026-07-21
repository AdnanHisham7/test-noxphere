// src/interfaces/http/controllers/AuthController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthUseCases } from '../../../application/use-cases/auth/AuthUseCases';
import { ResponseHandler } from '../../../shared/utils/ResponseHandler';
import {
  LoginSchema,
  RegisterSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
} from '../../../application/dtos/auth.dto';

export class AuthController {
  constructor(private readonly authUseCases: AuthUseCases) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RegisterSchema.parse(req.body);
      const result = await this.authUseCases.register(dto);
      ResponseHandler.created(res, result, 'Account created successfully');
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = LoginSchema.parse(req.body);
      const result = await this.authUseCases.login(dto);
      ResponseHandler.success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RefreshTokenSchema.parse(req.body);
      const tokens = await this.authUseCases.refreshToken(dto);
      ResponseHandler.success(res, tokens, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fcmToken } = req.body;
      await this.authUseCases.logout(req.user!.sub, fcmToken);
      ResponseHandler.noContent(res, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);
      await this.authUseCases.changePassword(req.user!.sub, currentPassword, newPassword);
      ResponseHandler.success(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Return user info from token payload (already validated by middleware)
      ResponseHandler.success(res, req.user, 'Profile retrieved');
    } catch (err) {
      next(err);
    }
  };
}
