// src/interfaces/http/controllers/CoachPortalController.ts
import { Request, Response, NextFunction } from "express";
import { CoachPortalUseCases } from "../../../application/use-cases/coach-portal/CoachPortalUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";

export class CoachPortalController {
  constructor(private coachPortalUseCases: CoachPortalUseCases) {}

  getMyRoster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roster = await this.coachPortalUseCases.getMyRoster(req.user!.sub);
      ResponseHandler.success(res, roster, "Roster retrieved");
    } catch (err) {
      next(err);
    }
  };

  getMyDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dashboard = await this.coachPortalUseCases.getMyDashboard(req.user!.sub);
      ResponseHandler.success(res, dashboard, "Dashboard retrieved");
    } catch (err) {
      next(err);
    }
  };
}
