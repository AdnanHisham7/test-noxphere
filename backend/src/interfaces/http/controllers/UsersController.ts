// src/interfaces/http/controllers/UsersController.ts
import { Request, Response, NextFunction } from "express";
import { UsersUseCases } from "../../../application/use-cases/users/UsersUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";
import { CreateUserSchema, UpdateUserSchema, ResetPasswordSchema } from "../../../application/dtos/users.dto";

export class UsersController {
  constructor(private readonly usersUseCases: UsersUseCases) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roles, franchiseId, isActive, search, page = "1", limit = "20" } = req.query;
      const result = await this.usersUseCases.listUsers({
        roles: roles as string,
        franchiseId: franchiseId as string,
        isActive: isActive as string,
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
      ResponseHandler.paginated(res, result.data, result.total, result.page, result.limit, "Users retrieved");
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.usersUseCases.getUserById(req.params.id);
      ResponseHandler.success(res, user);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateUserSchema.parse(req.body);
      const user = await this.usersUseCases.createUser(dto);
      ResponseHandler.created(res, user, "User created successfully");
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateUserSchema.parse(req.body);
      const user = await this.usersUseCases.updateUser(req.params.id, dto);
      ResponseHandler.success(res, user, "User updated successfully");
    } catch (err) {
      next(err);
    }
  };

  toggleActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.usersUseCases.toggleActive(req.params.id);
      ResponseHandler.success(res, user, `User ${user.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = ResetPasswordSchema.parse(req.body);
      const user = await this.usersUseCases.resetPassword(req.params.id, dto);
      ResponseHandler.success(res, user, "Password reset successfully");
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.usersUseCases.deleteUser(req.params.id, req.user!.sub);
      ResponseHandler.noContent(res, "User deleted successfully");
    } catch (err) {
      next(err);
    }
  };
}
