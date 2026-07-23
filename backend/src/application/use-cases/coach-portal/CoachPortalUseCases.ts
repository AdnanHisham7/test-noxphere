// src/application/use-cases/coach-portal/CoachPortalUseCases.ts
import mongoose from "mongoose";
import { StudentModel } from "../../../infrastructure/database/models/Student.model";
import { SessionModel } from "../../../infrastructure/database/models/Session.model";
import { TeamModel } from "../../../infrastructure/database/models/Team.model";

export class CoachPortalUseCases {
  /** Reads here are scoped to students on a team assigned to the logged-in
   *  coach (Team.coachId), unioned with any student explicitly assigned to
   *  them directly (e.g. trial players not yet placed on a team). Deriving
   *  the team half fresh from Team.coachId on every call — rather than
   *  trusting Student.coachId alone — means a team's coach reassignment
   *  can never leave the old coach still seeing that team's roster, or the
   *  new coach missing it. Attendance/performance are written against a
   *  real scheduled session — see ScheduleUseCases.markSessionAttendance /
   *  logSessionPerformance, reached from a session's roster page. Coach
   *  remarks (freeform notes, not attendance or scores) still go through
   *  StudentController, which already checks canManagePerformance — true
   *  for coaches by default. */

  private async getRosterFilter(coachUserId: string) {
    const coachObjectId = new mongoose.Types.ObjectId(coachUserId);
    const teams = await TeamModel.find({
      coachId: coachObjectId,
      deletedAt: { $exists: false },
    })
      .select("_id")
      .lean();
    const teamIds = teams.map((t) => t._id);
    return {
      deletedAt: { $exists: false },
      $or: [{ teamId: { $in: teamIds } }, { coachId: coachObjectId }],
    };
  }

  async getMyRoster(coachUserId: string) {
    const filter = await this.getRosterFilter(coachUserId);
    return StudentModel.find(filter)
      .populate("teamId", "name ageGroup")
      .sort({ firstName: 1 })
      .lean();
  }

  async getMyDashboard(coachUserId: string) {
    const filter = await this.getRosterFilter(coachUserId);
    const roster = await StudentModel.find(filter).lean();

    const roundedRoster = roster.map((s) => ({
      id: s._id.toString(),
      firstName: s.firstName,
      lastName: s.lastName,
      photo: s.photo,
      attendancePercentage: s.attendancePercentage,
      overallRating: s.overallRating,
    }));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const sessions = await SessionModel.find({
      coachId: new mongoose.Types.ObjectId(coachUserId),
      status: { $ne: "cancelled" },
    })
      .populate("teamId", "name")
      .sort({ date: 1, startTime: 1 })
      .lean();

    const todayStr = todayStart.toISOString().slice(0, 10);
    const todaySessions = sessions.filter((s) => s.date === todayStr);
    const upcomingSessions = sessions
      .filter((s) => s.date >= todayStr && new Date(s.date) <= weekEnd && s.status === "upcoming")
      .slice(0, 5);

    const toCard = (s: any) => ({
      id: s._id.toString(),
      targetType: s.targetType ?? "team",
      teamName: s.targetType === "category" ? (s.category ?? "Category") : (s.teamId?.name ?? "Team"),
      type: s.type,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      status: s.status,
    });

    return {
      roster: roundedRoster,
      todaySessions: todaySessions.map(toCard),
      upcomingSessions: upcomingSessions.map(toCard),
    };
  }
}