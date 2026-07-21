import { Request, Response, NextFunction } from "express";
import { AdminPerformanceUseCases } from "../../../application/use-cases/performance/AdminPerformanceUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";
import { BadRequestError } from "../../../shared/errors/AppError";

export class AdminPerformanceController {
  constructor(private performanceUseCases: AdminPerformanceUseCases) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId, teamId, studentId } = req.query;
      if (!franchiseId) throw new BadRequestError("franchiseId is required");
      const records = await this.performanceUseCases.list(franchiseId as string, {
        teamId: teamId as string | undefined,
        studentId: studentId as string | undefined,
      });
      ResponseHandler.success(res, records, "Performance records retrieved");
    } catch (err) {
      next(err);
    }
  };
}
