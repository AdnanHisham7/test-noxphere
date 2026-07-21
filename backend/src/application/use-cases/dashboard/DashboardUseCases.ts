// src/application/use-cases/dashboard/DashboardUseCases.ts
import { StudentModel } from "../../../infrastructure/database/models/Student.model";
import { TeamModel } from "../../../infrastructure/database/models/Team.model";
import { AttendanceModel } from "../../../infrastructure/database/models/Attendance.model";
import { PerformanceModel } from "../../../infrastructure/database/models/Performance.model";
import { FeeModel } from "../../../infrastructure/database/models/Fee.model";
import { BadRequestError } from "../../../shared/errors/AppError";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export class DashboardUseCases {
  async getStats(franchiseId: string) {
    if (!franchiseId) throw new BadRequestError("franchiseId is required");

    const [totalStudents, pendingStudents, students, fees] = await Promise.all([
      StudentModel.countDocuments({ franchiseId, isActive: true }),
      StudentModel.countDocuments({ franchiseId, isActive: false }),
      StudentModel.find({ franchiseId, isActive: true }).select("attendancePercentage overallRating"),
      FeeModel.find({ franchiseId }),
    ]);

    const avgAttendance =
      students.length > 0
        ? students.reduce((s, st) => s + (st.attendancePercentage || 0), 0) / students.length
        : 0;
    const avgRating =
      students.length > 0
        ? students.reduce((s, st) => s + (st.overallRating || 0), 0) / students.length
        : 0;

    let feesCollected = 0;
    let feesOutstanding = 0;
    for (const fee of fees) {
      const paid = fee.installments.reduce((s, i) => s + i.paidAmount, 0);
      feesCollected += paid;
      feesOutstanding += fee.finalAmount - paid;
    }

    return {
      totalStudents,
      pendingEnrollment: pendingStudents,
      avgAttendance: round1(avgAttendance),
      avgRating: round1(avgRating),
      feesCollected: round1(feesCollected),
      feesOutstanding: round1(feesOutstanding),
    };
  }

  async getAttendanceTrend(franchiseId: string, days = 7) {
    if (!franchiseId) throw new BadRequestError("franchiseId is required");
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const records = await AttendanceModel.find({ franchiseId, sessionDate: { $gte: since } }).select("sessionDate status");
    const buckets = new Map<string, { present: number; total: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      buckets.set(d.toISOString().split("T")[0], { present: 0, total: 0 });
    }
    for (const r of records) {
      const key = new Date(r.sessionDate).toISOString().split("T")[0];
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.total += 1;
      if (r.status === "present" || r.status === "late") bucket.present += 1;
    }
    return Array.from(buckets.entries()).map(([date, b]) => ({
      date,
      day: new Date(date).toLocaleDateString("en-IN", { weekday: "short" }),
      rate: b.total > 0 ? round1((b.present / b.total) * 100) : 0,
    }));
  }

  async getSkillRadar(franchiseId: string) {
    if (!franchiseId) throw new BadRequestError("franchiseId is required");
    const performances = await PerformanceModel.find({ franchiseId })
      .sort({ sessionDate: -1 })
      .limit(500)
      .select("skillScores");

    const totals = new Map<string, { sum: number; count: number }>();
    for (const p of performances) {
      for (const s of p.skillScores) {
        const bucket = totals.get(s.parameter) ?? { sum: 0, count: 0 };
        bucket.sum += s.score;
        bucket.count += 1;
        totals.set(s.parameter, bucket);
      }
    }
    return Array.from(totals.entries()).map(([skill, v]) => ({
      skill,
      avg: v.count > 0 ? round1(v.sum / v.count) : 0,
    }));
  }

  async getTeamHealth(franchiseId: string) {
    if (!franchiseId) throw new BadRequestError("franchiseId is required");
    const teams = await TeamModel.find({ franchiseId, isActive: true }).populate(
      "coachId",
      "firstName lastName",
    );

    return Promise.all(
      teams.map(async (team: any) => {
        const students = await StudentModel.find({ teamId: team._id, isActive: true }).select(
          "attendancePercentage overallRating",
        );
        const attendance =
          students.length > 0
            ? students.reduce((s, st) => s + (st.attendancePercentage || 0), 0) / students.length
            : 0;
        const performance =
          students.length > 0
            ? students.reduce((s, st) => s + (st.overallRating || 0), 0) / students.length
            : 0;
        return {
          name: team.name,
          attendance: round1(attendance),
          performance: round1(performance),
          students: students.length,
          coach: team.coachId ? `${team.coachId.firstName} ${team.coachId.lastName}` : "Unassigned",
        };
      }),
    );
  }

  async getTopPerformers(franchiseId: string, limit = 5) {
    if (!franchiseId) throw new BadRequestError("franchiseId is required");
    const students = await StudentModel.find({ franchiseId, isActive: true })
      .populate("teamId", "name")
      .sort({ overallRating: -1 })
      .limit(limit);
    return students.map((s: any) => ({
      id: s._id.toString(),
      name: `${s.firstName} ${s.lastName}`,
      rating: s.overallRating,
      team: s.teamId?.name ?? "Unassigned",
      position: s.position ?? "—",
      avatar: s.photo,
    }));
  }

  async getRecentActivity(franchiseId: string, limit = 10) {
    if (!franchiseId) throw new BadRequestError("franchiseId is required");
    const [attendance, performance, fees] = await Promise.all([
      AttendanceModel.find({ franchiseId }).sort({ createdAt: -1 }).limit(limit).populate("studentId", "firstName lastName"),
      PerformanceModel.find({ franchiseId }).sort({ createdAt: -1 }).limit(limit).populate("studentId", "firstName lastName"),
      FeeModel.find({ franchiseId, "installments.paidAt": { $exists: true } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate("studentId", "firstName lastName"),
    ]);

    const events = [
      ...attendance.map((a: any) => ({
        id: a._id.toString(),
        type: "attendance",
        message: `${a.studentId?.firstName ?? "A student"} marked ${a.status}`,
        time: a.createdAt,
        icon: "✓",
      })),
      ...performance.map((p: any) => ({
        id: p._id.toString(),
        type: "performance",
        message: `Performance recorded for ${p.studentId?.firstName ?? "a student"}`,
        time: p.createdAt,
        icon: "📈",
      })),
      ...fees.map((f: any) => ({
        id: f._id.toString(),
        type: "fee",
        message: `Payment recorded for ${f.studentId?.firstName ?? "a student"}`,
        time: f.updatedAt,
        icon: "💳",
      })),
    ];

    return events
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, limit);
  }
}
