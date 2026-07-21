// src/interfaces/http/controllers/StudentPortalController.ts
import { Request, Response, NextFunction } from "express";
import { StudentPortalUseCases } from "../../../application/use-cases/student-portal/StudentPortalUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";

export class StudentPortalController {
  constructor(private studentPortalUseCases: StudentPortalUseCases) {}

  getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.studentPortalUseCases.getMyProfile(req.user!.sub);
      ResponseHandler.success(res, profile, "Profile retrieved");
    } catch (err) {
      next(err);
    }
  };

  getMyDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dashboard = await this.studentPortalUseCases.getMyDashboard(req.user!.sub);
      ResponseHandler.success(res, dashboard, "Dashboard retrieved");
    } catch (err) {
      next(err);
    }
  };

  getMyAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { month } = req.query;
      const attendance = await this.studentPortalUseCases.getMyAttendance(
        req.user!.sub,
        month as string | undefined,
      );
      ResponseHandler.success(res, attendance, "Attendance retrieved");
    } catch (err) {
      next(err);
    }
  };

  getMyFees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fees = await this.studentPortalUseCases.getMyFees(req.user!.sub);
      ResponseHandler.success(res, fees, "Fees retrieved");
    } catch (err) {
      next(err);
    }
  };

  getMyPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const performance = await this.studentPortalUseCases.getMyPerformance(req.user!.sub);
      ResponseHandler.success(res, performance, "Performance retrieved");
    } catch (err) {
      next(err);
    }
  };
}
