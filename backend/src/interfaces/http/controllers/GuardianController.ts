// src/interfaces/http/controllers/GuardianController.ts
import { Request, Response, NextFunction } from "express";
import { GuardianUseCases } from "../../../application/use-cases/guardian/GuardianUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";

export class GuardianController {
  constructor(private guardianUseCases: GuardianUseCases) {}

  getMyChildren = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const children = await this.guardianUseCases.getMyChildren(req.user!.sub);
      ResponseHandler.success(res, children, "Children retrieved");
    } catch (err) {
      next(err);
    }
  };

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dashboard = await this.guardianUseCases.getDashboard(req.user!.sub);
      ResponseHandler.success(res, dashboard, "Dashboard retrieved");
    } catch (err) {
      next(err);
    }
  };

  getChildAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { month } = req.query;
      const attendance = await this.guardianUseCases.getChildAttendance(
        req.user!.sub,
        req.params.studentId,
        month as string | undefined,
      );
      ResponseHandler.success(res, attendance, "Attendance retrieved");
    } catch (err) {
      next(err);
    }
  };

  getChildFees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fees = await this.guardianUseCases.getChildFees(req.user!.sub, req.params.studentId);
      ResponseHandler.success(res, fees, "Fees retrieved");
    } catch (err) {
      next(err);
    }
  };

  getChildPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const performance = await this.guardianUseCases.getChildPerformance(
        req.user!.sub,
        req.params.studentId,
      );
      ResponseHandler.success(res, performance, "Performance retrieved");
    } catch (err) {
      next(err);
    }
  };

  getChildProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await this.guardianUseCases.getChildProfile(req.user!.sub, req.params.studentId);
      ResponseHandler.success(res, student, "Student profile retrieved");
    } catch (err) {
      next(err);
    }
  };
}
