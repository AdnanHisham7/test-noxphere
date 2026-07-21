// src/application/use-cases/coach-portal/CoachPortalUseCases.ts
import mongoose from "mongoose";
import { StudentModel } from "../../../infrastructure/database/models/Student.model";
import { SessionModel } from "../../../infrastructure/database/models/Session.model";

export class CoachPortalUseCases {
  /** Reads here are scoped to students where coachId === the logged-in coach.
   *  Attendance/performance are written against a real scheduled session —
   *  see ScheduleUseCases.markSessionAttendance / logSessionPerformance,
   *  reached from a session's roster page. Coach remarks (freeform notes,
   *  not attendance or scores) still go through StudentController, which
   *  already checks canManagePerformance — true for coaches by default. */

  async getMyRoster(coachUserId: string) {
    return StudentModel.find({
      coachId: new mongoose.Types.ObjectId(coachUserId),
      deletedAt: { $exists: false },
    })
      .populate("teamId", "name ageGroup")
      .sort({ firstName: 1 })
      .lean();
  }

  async getMyDashboard(coachUserId: string) {
    const roster = await StudentModel.find({
      coachId: new mongoose.Types.ObjectId(coachUserId),
      deletedAt: { $exists: false },
    }).lean();

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