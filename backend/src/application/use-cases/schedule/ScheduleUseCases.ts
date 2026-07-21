// src/application/use-cases/schedule/ScheduleUseCases.ts
import mongoose from "mongoose";
import { SessionModel } from "../../../infrastructure/database/models/Session.model";
import { TeamModel } from "../../../infrastructure/database/models/Team.model";
import { StudentModel } from "../../../infrastructure/database/models/Student.model";
import { AttendanceModel } from "../../../infrastructure/database/models/Attendance.model";
import { PerformanceModel } from "../../../infrastructure/database/models/Performance.model";
import { FranchiseModel } from "../../../infrastructure/database/models/Franchise.model";
import { AcademyModel } from "../../../infrastructure/database/models/Academy.model";
import { notificationService } from "../../../infrastructure/services/NotificationService";
import { NotFoundError, BadRequestError } from "../../../shared/errors/AppError";
import {
  CreateSessionDto,
  UpdateSessionDto,
  ChangeLocationDto,
  CancelSessionDto,
} from "../../dtos/schedule.dto";

export interface MarkAttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
}

export interface LogPerformanceRecord {
  studentId: string;
  skillScores: { parameter: string; score: number }[];
  remarks?: string;
  videoUrl?: string;
}

function toCard(doc: any) {
  const json = doc.toJSON ? doc.toJSON() : doc;
  return {
    id: json.id,
    franchiseId: json.franchiseId?.toString ? json.franchiseId.toString() : json.franchiseId,
    targetType: json.targetType ?? "team",
    teamId: json.teamId?._id
      ? json.teamId._id.toString()
      : json.teamId?.toString?.() ?? json.teamId ?? undefined,
    category: json.category ?? json.teamId?.ageGroup ?? undefined,
    teamName: json.teamId?.name ?? undefined,
    categoryColor: "#ccff00",
    coach: json.coachId?.firstName
      ? `${json.coachId.firstName} ${json.coachId.lastName ?? ""}`.trim()
      : undefined,
    coachId: json.coachId?._id ? json.coachId._id.toString() : json.coachId?.toString?.() ?? json.coachId,
    type: json.type,
    date: json.date,
    startTime: json.startTime,
    endTime: json.endTime,
    location: json.location,
    fieldNumber: json.fieldNumber,
    status: json.status,
    notes: json.notes,
    cancelReason: json.cancelReason,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
}

export class ScheduleUseCases {
  async listSessions(filters: {
    franchiseId: string;
    from?: string;
    to?: string;
    teamId?: string;
    coachId?: string;
    status?: string;
  }) {
    if (!filters.franchiseId) throw new BadRequestError("franchiseId is required");
    const query: Record<string, unknown> = { franchiseId: filters.franchiseId };
    if (filters.teamId) query.teamId = filters.teamId;
    if (filters.coachId) query.coachId = filters.coachId;
    if (filters.status) query.status = filters.status;
    if (filters.from || filters.to) {
      query.date = {
        ...(filters.from && { $gte: filters.from }),
        ...(filters.to && { $lte: filters.to }),
      };
    }
    const sessions = await SessionModel.find(query)
      .populate("teamId", "name ageGroup")
      .populate("coachId", "firstName lastName")
      .sort({ date: 1, startTime: 1 });
    return sessions.map(toCard);
  }

  async getSessionById(id: string) {
    const session = await SessionModel.findById(id)
      .populate("teamId", "name ageGroup")
      .populate("coachId", "firstName lastName");
    if (!session) throw new NotFoundError("Session");
    return toCard(session);
  }

  async createSession(dto: CreateSessionDto, createdBy: string) {
    if (dto.endTime <= dto.startTime) {
      throw new BadRequestError("endTime must be after startTime");
    }
    if (!dto.coachId) {
      throw new BadRequestError("coachId is required");
    }

    if (dto.targetType === "category") {
      if (!dto.category) throw new BadRequestError("category is required for a category session");
      const franchise = await FranchiseModel.findById(dto.franchiseId).select("ageGroups").lean();
      if (!franchise) throw new NotFoundError("Franchise");
      if (franchise.ageGroups?.length && !franchise.ageGroups.includes(dto.category)) {
        throw new BadRequestError(
          `"${dto.category}" isn't one of this franchise's configured age groups (${franchise.ageGroups.join(", ")})`,
        );
      }
    } else {
      if (!dto.teamId) throw new BadRequestError("teamId is required for a team session");
      const team = await TeamModel.findById(dto.teamId);
      if (!team) throw new NotFoundError("Team");
      if (team.franchiseId.toString() !== dto.franchiseId) {
        throw new BadRequestError("That team doesn't belong to this franchise");
      }
    }

    const session = await SessionModel.create({
      franchiseId: dto.franchiseId,
      targetType: dto.targetType,
      teamId: dto.targetType === "team" ? dto.teamId : undefined,
      category: dto.targetType === "category" ? dto.category : undefined,
      coachId: dto.coachId,
      type: dto.type,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      location: dto.location,
      fieldNumber: dto.fieldNumber,
      notes: dto.notes,
      createdBy,
      status: "upcoming",
    });
    const populated = await SessionModel.findById(session.id)
      .populate("teamId", "name ageGroup")
      .populate("coachId", "firstName lastName");
    return toCard(populated);
  }

  async updateSession(id: string, dto: UpdateSessionDto) {
    const session = await SessionModel.findById(id);
    if (!session) throw new NotFoundError("Session");
    if (dto.startTime && dto.endTime && dto.endTime <= dto.startTime) {
      throw new BadRequestError("endTime must be after startTime");
    }
    Object.assign(session, dto);
    await session.save();
    const populated = await SessionModel.findById(id)
      .populate("teamId", "name ageGroup")
      .populate("coachId", "firstName lastName");
    return toCard(populated);
  }

  async cancelSession(id: string, dto: CancelSessionDto) {
    const session = await SessionModel.findById(id);
    if (!session) throw new NotFoundError("Session");
    session.status = "cancelled";
    session.cancelReason = dto.reason;
    await session.save();
    await this.notifySessionGuardians(session, {
      title: "Session cancelled",
      body: `The ${session.date} session at ${session.location} has been cancelled. Reason: ${dto.reason}`,
      type: "session_location_change",
    });
    const populated = await SessionModel.findById(id)
      .populate("teamId", "name ageGroup")
      .populate("coachId", "firstName lastName");
    return toCard(populated);
  }

  async deleteSession(id: string): Promise<void> {
    const session = await SessionModel.findByIdAndUpdate(id, { deletedAt: new Date() });
    if (!session) throw new NotFoundError("Session");
  }

  async changeLocation(id: string, dto: ChangeLocationDto) {
    const session = await SessionModel.findById(id);
    if (!session) throw new NotFoundError("Session");
    session.location = dto.location;
    if (dto.fieldNumber !== undefined) session.fieldNumber = dto.fieldNumber;
    await session.save();

    if (dto.notifyGuardians) {
      await this.notifySessionGuardians(session, {
        title: "Session location changed",
        body: `The ${session.date} session is now at ${dto.location}${dto.fieldNumber ? ` (${dto.fieldNumber})` : ""}.`,
        type: "session_location_change",
      });
    }
    const populated = await SessionModel.findById(id)
      .populate("teamId", "name ageGroup")
      .populate("coachId", "firstName lastName");
    return toCard(populated);
  }

  async alertAllGuardians(franchiseId: string, message: string) {
    const students = await StudentModel.find({ franchiseId, isActive: true });
    const guardianIds = Array.from(
      new Set(students.flatMap((s) => s.guardianIds.map((g) => g.toString()))),
    );
    if (guardianIds.length === 0) return { notified: 0 };
    await notificationService.send({
      userIds: guardianIds,
      type: "session_location_change",
      title: "Schedule update",
      body: message,
      franchiseId,
      channels: ["push"],
    });
    return { notified: guardianIds.length };
  }

  /**
   * Performance skill parameters are owned by the Academy record (defined
   * there by the manager), not by the Franchise — every session belongs to
   * a franchise, and every franchise belongs to exactly one academy, so we
   * resolve franchise -> academy to find the parameter list that's allowed
   * to be scored against. Falls back to the platform default set if
   * somehow neither record carries any (keeps old data / dev fixtures
   * from hard-failing).
   */
  private async getSkillParametersForFranchise(franchiseId: mongoose.Types.ObjectId | string): Promise<string[]> {
    const franchise = await FranchiseModel.findById(franchiseId).select("academyId").lean();
    if (!franchise) throw new NotFoundError("Franchise");
    const academy = await AcademyModel.findById(franchise.academyId).select("skillParameters").lean();
    if (academy?.skillParameters?.length) return academy.skillParameters;
    return ["Dribbling", "Passing", "Shooting", "Speed", "Tactical Awareness", "Attitude"];
  }

  /**
   * The roster for a session: every student on that session's team, merged
   * with whatever attendance/performance has already been recorded for
   * this exact session (so re-opening a partially-marked session shows
   * what's already saved instead of a blank sheet).
   */
  async getSessionRoster(sessionId: string) {
    const session = await SessionModel.findById(sessionId)
      .populate("teamId", "name ageGroup")
      .populate("coachId", "firstName lastName");
    if (!session) throw new NotFoundError("Session");

    const studentQuery =
      session.targetType === "category"
        ? { franchiseId: session.franchiseId, ageGroup: session.category, isActive: true }
        : { teamId: session.teamId, isActive: true };

    const students = await StudentModel.find(studentQuery)
      .select("firstName lastName photo position jerseyNumber teamId")
      .sort({ firstName: 1 })
      .lean();

    const [attendance, performance, skillParameters] = await Promise.all([
      AttendanceModel.find({ sessionId }).lean(),
      PerformanceModel.find({ sessionId }).lean(),
      this.getSkillParametersForFranchise(session.franchiseId),
    ]);
    const attendanceByStudent = new Map(attendance.map((a) => [a.studentId.toString(), a]));
    const performanceByStudent = new Map(performance.map((p) => [p.studentId.toString(), p]));

    return {
      session: toCard(session),
      skillParameters,
      roster: students.map((s) => {
        const att = attendanceByStudent.get(s._id.toString());
        const perf = performanceByStudent.get(s._id.toString());
        return {
          studentId: s._id.toString(),
          firstName: s.firstName,
          lastName: s.lastName,
          photo: s.photo,
          position: s.position,
          jerseyNumber: s.jerseyNumber,
          attendanceStatus: att?.status ?? null,
          attendanceRemarks: att?.remarks ?? null,
          performanceRecorded: !!perf,
          skillScores: perf?.skillScores ?? null,
          overallScore: perf?.overallScore ?? null,
          performanceRemarks: perf?.remarks ?? null,
        };
      }),
    };
  }

  /**
   * Bulk-mark attendance for a session's roster. This is the only path to
   * write attendance — it always requires a real, non-cancelled scheduled
   * session, so attendance can never be recorded for a date/team that was
   * never actually scheduled.
   */
  async markSessionAttendance(sessionId: string, records: MarkAttendanceRecord[], coachId: string) {
    if (!records.length) throw new BadRequestError("At least one attendance record is required");
    const session = await SessionModel.findById(sessionId);
    if (!session) throw new NotFoundError("Session");
    if (session.status === "cancelled") {
      throw new BadRequestError("This session was cancelled — attendance can't be marked for it");
    }

    const studentTeamMap = new Map<string, mongoose.Types.ObjectId | undefined>();
    if (session.targetType === "category") {
      const students = await StudentModel.find({ _id: { $in: records.map((r) => r.studentId) } })
        .select("teamId")
        .lean();
      for (const s of students) studentTeamMap.set(s._id.toString(), s.teamId);
    }

    const ops = records.map((r) => ({
      updateOne: {
        filter: {
          studentId: new mongoose.Types.ObjectId(r.studentId),
          sessionId: new mongoose.Types.ObjectId(sessionId),
        },
        update: {
          $set: {
            studentId: new mongoose.Types.ObjectId(r.studentId),
            franchiseId: session.franchiseId,
            teamId: session.targetType === "team" ? session.teamId : studentTeamMap.get(r.studentId),
            coachId: new mongoose.Types.ObjectId(coachId),
            sessionId: new mongoose.Types.ObjectId(sessionId),
            sessionDate: new Date(session.date),
            status: r.status,
            remarks: r.remarks,
            markedBy: coachId,
          },
        },
        upsert: true,
      },
    }));
    await AttendanceModel.bulkWrite(ops);

    // keep the denormalised attendancePercentage on Student roughly current
    for (const r of records) {
      const [total, present] = await Promise.all([
        AttendanceModel.countDocuments({ studentId: r.studentId }),
        AttendanceModel.countDocuments({
          studentId: r.studentId,
          status: { $in: ["present", "late"] },
        }),
      ]);
      await StudentModel.updateOne(
        { _id: r.studentId },
        { $set: { attendancePercentage: total ? Math.round((present / total) * 100) : 0 } },
      );
    }

    // Marking attendance means the session took place — close it out.
    if (session.status === "upcoming" || session.status === "ongoing") {
      session.status = "completed";
      await session.save();
    }

    // Notify guardians of absent/late players for this session.
    const absentOrLate = records.filter((r) => r.status === "absent" || r.status === "late");
    for (const r of absentOrLate) {
      const student = await StudentModel.findById(r.studentId);
      if (!student || student.guardianIds.length === 0) continue;
      await notificationService
        .sendAttendanceAlert(
          student.guardianIds.map((g) => g.toString()),
          `${student.firstName} ${student.lastName}`,
          r.status as "absent" | "late",
          session.franchiseId.toString(),
        )
        .catch(() => undefined);
    }

    return this.getSessionRoster(sessionId);
  }

  /**
   * Bulk-log performance for a session's roster. Same constraint as
   * attendance — always tied to a real, non-cancelled scheduled session.
   */
  async logSessionPerformance(sessionId: string, records: LogPerformanceRecord[], coachId: string) {
    if (!records.length) throw new BadRequestError("At least one performance record is required");
    const session = await SessionModel.findById(sessionId);
    if (!session) throw new NotFoundError("Session");
    if (session.status === "cancelled") {
      throw new BadRequestError("This session was cancelled — performance can't be logged for it");
    }

    const allowedParameters = await this.getSkillParametersForFranchise(session.franchiseId);
    const allowedSet = new Set(allowedParameters);

    const studentTeamMap = new Map<string, mongoose.Types.ObjectId | undefined>();
    if (session.targetType === "category") {
      const students = await StudentModel.find({ _id: { $in: records.map((r) => r.studentId) } })
        .select("teamId")
        .lean();
      for (const s of students) studentTeamMap.set(s._id.toString(), s.teamId);
    }

    for (const r of records) {
      if (!r.skillScores.length) {
        throw new BadRequestError(`At least one skill score is required for student ${r.studentId}`);
      }
      const invalidParams = r.skillScores
        .map((s) => s.parameter)
        .filter((p) => !allowedSet.has(p));
      if (invalidParams.length) {
        throw new BadRequestError(
          `Invalid skill parameter(s) for this academy: ${invalidParams.join(", ")}. Allowed: ${allowedParameters.join(", ")}`,
        );
      }
      const overallScore =
        r.skillScores.reduce((sum, s) => sum + s.score, 0) / r.skillScores.length;

      await PerformanceModel.updateOne(
        { studentId: r.studentId, sessionId },
        {
          $set: {
            studentId: r.studentId,
            franchiseId: session.franchiseId,
            teamId: session.targetType === "team" ? session.teamId : studentTeamMap.get(r.studentId),
            coachId,
            sessionId,
            sessionDate: new Date(session.date),
            skillScores: r.skillScores,
            overallScore: Math.round(overallScore * 10) / 10,
            remarks: r.remarks,
            videoUrl: r.videoUrl,
          },
        },
        { upsert: true },
      );
    }

    // keep the denormalised overallRating on Student roughly current
    for (const r of records) {
      const recent = await PerformanceModel.find({ studentId: r.studentId })
        .sort({ sessionDate: -1 })
        .limit(10)
        .select("overallScore")
        .lean();
      const avg = recent.length
        ? recent.reduce((sum, p) => sum + p.overallScore, 0) / recent.length
        : 0;
      await StudentModel.updateOne(
        { _id: r.studentId },
        { $set: { overallRating: Math.round(avg * 10) / 10 } },
      );
    }

    if (session.status === "upcoming" || session.status === "ongoing") {
      session.status = "completed";
      await session.save();
    }

    return this.getSessionRoster(sessionId);
  }

  private async notifySessionGuardians(
    session: { targetType: string; teamId?: mongoose.Types.ObjectId; category?: string; franchiseId: mongoose.Types.ObjectId },
    opts: { title: string; body: string; type: "session_location_change" },
  ) {
    const query =
      session.targetType === "category"
        ? { franchiseId: session.franchiseId, ageGroup: session.category, isActive: true }
        : { teamId: session.teamId, isActive: true };
    const students = await StudentModel.find(query);
    const guardianIds = Array.from(
      new Set(students.flatMap((s) => s.guardianIds.map((g) => g.toString()))),
    );
    if (guardianIds.length === 0) return;
    await notificationService.send({
      userIds: guardianIds,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      channels: ["push"],
    });
  }
}