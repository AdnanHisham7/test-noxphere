// src/application/use-cases/guardian/GuardianUseCases.ts
import mongoose from "mongoose";
import { StudentModel } from "../../../infrastructure/database/models/Student.model";
import { AttendanceModel } from "../../../infrastructure/database/models/Attendance.model";
import { FeeModel } from "../../../infrastructure/database/models/Fee.model";
import { PerformanceModel } from "../../../infrastructure/database/models/Performance.model";
import { ForbiddenError } from "../../../shared/errors/AppError";

export class GuardianUseCases {
  /** Every read in this class is scoped to students linked to `guardianUserId`.
   *  A guardian can never fetch data for a student that isn't theirs. */

  private async assertOwnsStudent(guardianUserId: string, studentId: string) {
    const student = await StudentModel.findOne({
      _id: studentId,
      guardianIds: new mongoose.Types.ObjectId(guardianUserId),
      deletedAt: { $exists: false },
    });
    if (!student) {
      throw new ForbiddenError("You do not have access to this student");
    }
    return student;
  }

  async getMyChildren(guardianUserId: string) {
    const students = await StudentModel.find({
      guardianIds: new mongoose.Types.ObjectId(guardianUserId),
      deletedAt: { $exists: false },
    })
      .populate("teamId", "name ageGroup")
      .sort({ firstName: 1 })
      .lean();

    return students;
  }

  async getDashboard(guardianUserId: string) {
    const students = await StudentModel.find({
      guardianIds: new mongoose.Types.ObjectId(guardianUserId),
      deletedAt: { $exists: false },
    }).lean();

    if (!students.length) {
      return { children: [], todayAttendance: [], upcomingFees: [], overdueFees: [] };
    }

    const studentIds = students.map((s) => s._id);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayAttendance, fees] = await Promise.all([
      AttendanceModel.find({
        studentId: { $in: studentIds },
        sessionDate: { $gte: todayStart, $lte: todayEnd },
      }).lean(),
      FeeModel.find({ studentId: { $in: studentIds } }).lean(),
    ]);

    const upcomingFees: Array<{ studentId: string; installmentNumber: number; amount: number; dueDate: Date }> = [];
    const overdueFees: Array<{ studentId: string; installmentNumber: number; amount: number; dueDate: Date }> = [];
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    for (const fee of fees) {
      for (const inst of fee.installments) {
        if (inst.status === "paid" || inst.status === "refunded") continue;
        const entry = {
          studentId: fee.studentId.toString(),
          installmentNumber: inst.installmentNumber,
          amount: inst.amount - inst.paidAmount,
          dueDate: inst.dueDate,
        };
        if (inst.dueDate < now) {
          overdueFees.push(entry);
        } else if (inst.dueDate <= in14Days) {
          upcomingFees.push(entry);
        }
      }
    }

    return {
      children: students.map((s) => ({
        id: s._id.toString(),
        firstName: s.firstName,
        lastName: s.lastName,
        photo: s.photo,
        attendancePercentage: s.attendancePercentage,
        overallRating: s.overallRating,
      })),
      todayAttendance: todayAttendance.map((a) => ({
        studentId: a.studentId.toString(),
        status: a.status,
      })),
      upcomingFees,
      overdueFees,
    };
  }

  async getChildAttendance(guardianUserId: string, studentId: string, month?: string) {
    await this.assertOwnsStudent(guardianUserId, studentId);

    const query: Record<string, unknown> = { studentId };
    if (month) {
      // month format: YYYY-MM
      const [year, mon] = month.split("-").map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 0, 23, 59, 59, 999);
      query.sessionDate = { $gte: start, $lte: end };
    }

    const records = await AttendanceModel.find(query).sort({ sessionDate: -1 }).lean();
    const present = records.filter((r) => r.status === "present" || r.status === "late").length;

    return {
      records,
      summary: {
        total: records.length,
        present,
        absent: records.filter((r) => r.status === "absent").length,
        late: records.filter((r) => r.status === "late").length,
        excused: records.filter((r) => r.status === "excused").length,
        percentage: records.length ? Math.round((present / records.length) * 100) : 0,
      },
    };
  }

  async getChildFees(guardianUserId: string, studentId: string) {
    await this.assertOwnsStudent(guardianUserId, studentId);
    const fees = await FeeModel.find({ studentId }).sort({ createdAt: -1 }).lean();
    return fees;
  }

  async getChildPerformance(guardianUserId: string, studentId: string) {
    await this.assertOwnsStudent(guardianUserId, studentId);
    const records = await PerformanceModel.find({ studentId }).sort({ createdAt: -1 }).limit(20).lean();
    return records;
  }

  async getChildProfile(guardianUserId: string, studentId: string) {
    const student = await this.assertOwnsStudent(guardianUserId, studentId);
    return student;
  }
}
