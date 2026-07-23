// src/interfaces/http/controllers/ScheduleController.ts
import { Request, Response, NextFunction } from "express";
import { ScheduleUseCases } from "../../../application/use-cases/schedule/ScheduleUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";
import { BadRequestError, ForbiddenError } from "../../../shared/errors/AppError";
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

  /**
   * A coach can only view or act on a session that was assigned to them —
   * regardless of how they reached the session id (typed URL, stale link,
   * another franchise's data, etc). Every mutating/roster endpoint below
   * runs this check before doing anything else. Managers/super_admins are
   * unrestricted.
   */
  private async assertCoachOwnsSession(req: Request, sessionId: string): Promise<void> {
    if (req.user!.role !== "coach") return;
    const session = await this.scheduleUseCases.getSessionById(sessionId);
    if (session.coachId !== req.user!.sub) {
      throw new ForbiddenError("You can only manage sessions assigned to you");
    }
  }

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
      if (req.user!.role === "coach" && session.coachId !== req.user!.sub) {
        throw new ForbiddenError("You can only view sessions assigned to you");
      }
      ResponseHandler.success(res, session, "Session retrieved");
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateSessionSchema.parse(req.body);
      const isCoach = req.user!.role === "coach";
      // A coach can never schedule a category-wide session — only a
      // session for a team they're actually assigned to. The use-case
      // enforces the team-ownership half of this; the target-type
      // restriction is enforced here since it depends on nothing but role.
      if (isCoach && dto.targetType === "category") {
        throw new ForbiddenError("Coaches can only schedule sessions for a team they are assigned to");
      }
      // A coach can never schedule a session under someone else's name —
      // the logged-in coach is always the coach. A manager/super_admin
      // must explicitly pick one.
      const coachId = isCoach ? req.user!.sub : dto.coachId;
      if (!coachId) throw new BadRequestError("coachId is required");
      const session = await this.scheduleUseCases.createSession(
        { ...dto, coachId },
        req.user!.sub,
        isCoach ? req.user!.sub : undefined,
      );
      ResponseHandler.created(res, session, "Session scheduled");
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.assertCoachOwnsSession(req, req.params.id);
      const dto = UpdateSessionSchema.parse(req.body);
      if (req.user!.role === "coach") {
        // A coach may adjust the operational details of their own session
        // (time, location, notes, type) but can never re-target it to a
        // different team/category/franchise or hand it to another coach.
        delete dto.coachId;
        delete dto.teamId;
        delete dto.category;
        delete dto.targetType;
        delete dto.franchiseId;
      }
      const session = await this.scheduleUseCases.updateSession(req.params.id, dto);
      ResponseHandler.success(res, session, "Session updated");
    } catch (err) {
      next(err);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.assertCoachOwnsSession(req, req.params.id);
      const dto = CancelSessionSchema.parse(req.body);
      const session = await this.scheduleUseCases.cancelSession(req.params.id, dto);
      ResponseHandler.success(res, session, "Session cancelled");
    } catch (err) {
      next(err);
    }
  };

  changeLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.assertCoachOwnsSession(req, req.params.id);
      const dto = ChangeLocationSchema.parse(req.body);
      const session = await this.scheduleUseCases.changeLocation(req.params.id, dto);
      ResponseHandler.success(res, session, "Location updated and guardians notified");
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.assertCoachOwnsSession(req, req.params.id);
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
      console.log("roster:", roster.session, "req.user:", req.user);

      if (req.user!.role === "coach" && roster.session.coachId !== req.user!.sub) {
        throw new ForbiddenError("You can only view sessions assigned to you");
      }
      ResponseHandler.success(res, roster, "Session roster retrieved");
    } catch (err) {
      next(err);
    }
  };

  markAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.assertCoachOwnsSession(req, req.params.id);
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
      await this.assertCoachOwnsSession(req, req.params.id);
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