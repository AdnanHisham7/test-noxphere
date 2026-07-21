// src/application/use-cases/attendance/AdminAttendanceUseCases.ts
//
// Attendance can only be *marked* against a real scheduled session — see
// ScheduleUseCases.markSessionAttendance(), reached through
// POST /schedule/:id/attendance. This class is now read-only: it serves
// attendance history/reports across sessions, teams, and date ranges.
import { AttendanceModel } from "../../../infrastructure/database/models/Attendance.model";
import { BadRequestError } from "../../../shared/errors/AppError";

export class AdminAttendanceUseCases {
  async getHistory(
    franchiseId: string,
    filters: { teamId?: string; studentId?: string; from?: string; to?: string } = {},
  ) {
    if (!franchiseId) throw new BadRequestError("franchiseId is required");
    const query: Record<string, unknown> = { franchiseId };
    if (filters.teamId) query.teamId = filters.teamId;
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.from || filters.to) {
      query.sessionDate = {
        ...(filters.from && { $gte: new Date(filters.from) }),
        ...(filters.to && { $lte: new Date(filters.to) }),
      };
    }

    return AttendanceModel.find(query)
      .populate("studentId", "firstName lastName photo")
      .populate("teamId", "name")
      .populate("sessionId", "date type location")
      .sort({ sessionDate: -1 })
      .limit(300)
      .lean();
  }
}
