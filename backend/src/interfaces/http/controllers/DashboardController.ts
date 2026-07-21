// src/interfaces/http/controllers/DashboardController.ts
import { Request, Response, NextFunction } from "express";
import { DashboardUseCases } from "../../../application/use-cases/dashboard/DashboardUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";

export class DashboardController {
  constructor(private readonly dashboardUseCases: DashboardUseCases) {}

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardUseCases.getStats(req.query.franchiseId as string);
      ResponseHandler.success(res, data, "Dashboard stats retrieved");
    } catch (err) {
      next(err);
    }
  };

  getAttendanceTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { franchiseId, days } = req.query;
      const data = await this.dashboardUseCases.getAttendanceTrend(
        franchiseId as string,
        days ? parseInt(days as string) : undefined,
      );
      ResponseHandler.success(res, data, "Attendance trend retrieved");
    } catch (err) {
      next(err);
    }
  };

  getSkillRadar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardUseCases.getSkillRadar(req.query.franchiseId as string);
      ResponseHandler.success(res, data, "Skill radar retrieved");
    } catch (err) {
      next(err);
    }
  };

  getTeamHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardUseCases.getTeamHealth(req.query.franchiseId as string);
      ResponseHandler.success(res, data, "Team health retrieved");
    } catch (err) {
      next(err);
    }
  };

  getTopPerformers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { franchiseId, limit } = req.query;
      const data = await this.dashboardUseCases.getTopPerformers(
        franchiseId as string,
        limit ? parseInt(limit as string) : undefined,
      );
      ResponseHandler.success(res, data, "Top performers retrieved");
    } catch (err) {
      next(err);
    }
  };

  getRecentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { franchiseId, limit } = req.query;
      const data = await this.dashboardUseCases.getRecentActivity(
        franchiseId as string,
        limit ? parseInt(limit as string) : undefined,
      );
      ResponseHandler.success(res, data, "Recent activity retrieved");
    } catch (err) {
      next(err);
    }
  };
}
