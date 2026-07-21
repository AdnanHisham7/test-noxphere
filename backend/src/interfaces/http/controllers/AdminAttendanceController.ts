// src/interfaces/http/controllers/AdminAttendanceController.ts
import { Request, Response, NextFunction } from "express";
import { AdminAttendanceUseCases } from "../../../application/use-cases/attendance/AdminAttendanceUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";
import { BadRequestError } from "../../../shared/errors/AppError";

export class AdminAttendanceController {
  constructor(private attendanceUseCases: AdminAttendanceUseCases) {}

  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId, teamId, studentId, from, to } = req.query;
      if (!franchiseId) throw new BadRequestError("franchiseId is required");
      const history = await this.attendanceUseCases.getHistory(franchiseId as string, {
        teamId: teamId as string,
        studentId: studentId as string,
        from: from as string,
        to: to as string,
      });
      ResponseHandler.success(res, history, "Attendance history retrieved");
    } catch (err) {
      next(err);
    }
  };
}
