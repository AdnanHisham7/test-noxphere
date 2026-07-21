// src/interfaces/http/controllers/AttendanceController.ts
import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../../../shared/utils/ResponseHandler';

export class AttendanceController {
  constructor(private readonly attendanceUseCases: any) {}

  markBulkAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.attendanceUseCases.markBulkAttendance({
        ...req.body,
        coachId: req.user!.sub,
      });
      ResponseHandler.created(res, result, 'Attendance recorded');
    } catch (err) {
      next(err);
    }
  };

  getAttendanceByTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId } = req.params;
      const { date, from, to, page = '1', limit = '20' } = req.query;
      const result = await this.attendanceUseCases.getTeamAttendance({
        teamId,
        date: date as string,
        from: from as string,
        to: to as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
      ResponseHandler.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      next(err);
    }
  };

  getStudentAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { franchiseId } = req.query;
      const result = await this.attendanceUseCases.getStudentAttendanceSummary(
        studentId,
        franchiseId as string
      );
      ResponseHandler.success(res, result);
    } catch (err) {
      next(err);
    }
  };

  editAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.attendanceUseCases.editAttendance(id, req.body, req.user!.sub);
      ResponseHandler.success(res, result, 'Attendance updated');
    } catch (err) {
      next(err);
    }
  };

  syncOfflineAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.attendanceUseCases.syncOfflineAttendance(
        req.body.entries,
        req.user!.sub
      );
      ResponseHandler.success(res, result, 'Offline data synced');
    } catch (err) {
      next(err);
    }
  };
}

// src/interfaces/http/controllers/PerformanceController.ts
export class PerformanceController {
  constructor(private readonly performanceUseCases: any) {}

  submitBulkPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.performanceUseCases.submitBulkPerformance({
        ...req.body,
        coachId: req.user!.sub,
      });
      ResponseHandler.created(res, result, 'Performance data submitted');
    } catch (err) {
      next(err);
    }
  };

  getPlayerCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { franchiseId } = req.query;
      const result = await this.performanceUseCases.getPlayerCard(studentId, franchiseId as string);
      ResponseHandler.success(res, result);
    } catch (err) {
      next(err);
    }
  };

  getPerformanceHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { franchiseId, from, to, page = '1', limit = '20' } = req.query;
      const result = await this.performanceUseCases.getHistory({
        studentId,
        franchiseId: franchiseId as string,
        from: from as string,
        to: to as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
      ResponseHandler.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      next(err);
    }
  };

  approvePerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.performanceUseCases.approve(id, req.user!.sub);
      ResponseHandler.success(res, result, 'Performance approved');
    } catch (err) {
      next(err);
    }
  };

  generatePlayerReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;
      const { franchiseId, from, to } = req.query;
      const result = await this.performanceUseCases.generateReport({
        studentId,
        franchiseId: franchiseId as string,
        from: from as string,
        to: to as string,
      });
      ResponseHandler.success(res, result);
    } catch (err) {
      next(err);
    }
  };
}
