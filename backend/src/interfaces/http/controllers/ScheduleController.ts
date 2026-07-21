// src/interfaces/http/controllers/ScheduleController.ts
import { Request, Response, NextFunction } from "express";
import { ScheduleUseCases } from "../../../application/use-cases/schedule/ScheduleUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";
import { BadRequestError } from "../../../shared/errors/AppError";
import {
  CreateSessionSchema,
  UpdateSessionSchema,
  ChangeLocationSchema,
  CancelSessionSchema,
  MarkSessionAttendanceSchema,
  LogSessionPerformanceSchema,
} from "../../../application/dtos/schedule.dto";

export class ScheduleController {
  constructor(private readonly scheduleUseCases: ScheduleUseCases) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { franchiseId, from, to, teamId, status } = req.query;
      if (!franchiseId) throw new BadRequestError("franchiseId is required");
      // A coach only ever sees their own sessions — regardless of what
      // (if anything) was passed in the coachId query param.
      const coachId = req.user!.role === "coach" ? req.user!.sub : (req.query.coachId as string);
      const sessions = await this.scheduleUseCases.listSessions({
        franchiseId: franchiseId as string,
        from: from as string,
        to: to as string,
        teamId: teamId as string,
        coachId,
        status: status as string,
      });
      ResponseHandler.success(res, sessions, "Sessions retrieved");
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.scheduleUseCases.getSessionById(req.params.id);
      ResponseHandler.success(res, session, "Session retrieved");
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateSessionSchema.parse(req.body);
      // A coach can never schedule a session under someone else's name —
      // the logged-in coach is always the coach. A manager/super_admin
      // must explicitly pick one.
      const coachId = req.user!.role === "coach" ? req.user!.sub : dto.coachId;
      if (!coachId) throw new BadRequestError("coachId is required");
      const session = await this.scheduleUseCases.createSession({ ...dto, coachId }, req.user!.sub);
      ResponseHandler.created(res, session, "Session scheduled");
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateSessionSchema.parse(req.body);
      if (req.user!.role === "coach") delete dto.coachId;
      const session = await this.scheduleUseCases.updateSession(req.params.id, dto);
      ResponseHandler.success(res, session, "Session updated");
    } catch (err) {
      next(err);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CancelSessionSchema.parse(req.body);
      const session = await this.scheduleUseCases.cancelSession(req.params.id, dto);
      ResponseHandler.success(res, session, "Session cancelled");
    } catch (err) {
      next(err);
    }
  };

  changeLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = ChangeLocationSchema.parse(req.body);
      const session = await this.scheduleUseCases.changeLocation(req.params.id, dto);
      ResponseHandler.success(res, session, "Location updated and guardians notified");
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.scheduleUseCases.deleteSession(req.params.id);
      ResponseHandler.noContent(res, "Session deleted");
    } catch (err) {
      next(err);
    }
  };

  alertAllGuardians = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { franchiseId, message } = req.body;
      if (!franchiseId) throw new BadRequestError("franchiseId is required");
      const result = await this.scheduleUseCases.alertAllGuardians(
        franchiseId,
        message || "Please check the latest schedule for your ward's sessions.",
      );
      ResponseHandler.success(res, result, "Guardians notified");
    } catch (err) {
      next(err);
    }
  };

  getRoster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roster = await this.scheduleUseCases.getSessionRoster(req.params.id);
      ResponseHandler.success(res, roster, "Session roster retrieved");
    } catch (err) {
      next(err);
    }
  };

  markAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = MarkSessionAttendanceSchema.parse(req.body);
      const roster = await this.scheduleUseCases.markSessionAttendance(
        req.params.id,
        dto.records,
        req.user!.sub,
      );
      ResponseHandler.success(res, roster, "Attendance marked");
    } catch (err) {
      next(err);
    }
  };

  logPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = LogSessionPerformanceSchema.parse(req.body);
      const roster = await this.scheduleUseCases.logSessionPerformance(
        req.params.id,
        dto.records,
        req.user!.sub,
      );
      ResponseHandler.success(res, roster, "Performance logged");
    } catch (err) {
      next(err);
    }
  };
}