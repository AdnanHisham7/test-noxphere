import { IStudentRepository } from "../../../domain/repositories/IStudentRepository";
import { StudentModel, StudentDocument } from "../models/Student.model";
import {
  PerformanceModel,
  PerformanceDocument,
} from "../models/Performance.model";
import {
  AttendanceModel,
  AttendanceDocument,
} from "../models/Attendance.model";
import {
  CoachRemarkModel,
  CoachRemarkDocument,
} from "../models/CoachRemark.model";
import { StudentEntity } from "../../../domain/entities/Student.entity";
import { FilterQuery } from "mongoose";

export class StudentRepository implements IStudentRepository {
  // Student CRUD
  async create(data: Partial<StudentEntity>): Promise<StudentEntity> {
    const doc = await StudentModel.create(data);
    return this.toEntity(doc);
  }

  async findById(id: string): Promise<StudentEntity | null> {
    const doc = await StudentModel.findById(id).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async findAll(
    filter: any,
    page: number,
    limit: number,
  ): Promise<{ items: StudentEntity[]; total: number }> {
    const query: FilterQuery<StudentDocument> = { ...filter };
    const [items, total] = await Promise.all([
      StudentModel.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      StudentModel.countDocuments(query),
    ]);
    return { items: items.map((doc) => this.toEntity(doc)), total };
  }

  async update(
    id: string,
    data: Partial<StudentEntity>,
  ): Promise<StudentEntity | null> {
    const doc = await StudentModel.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await StudentModel.findByIdAndUpdate(id, {
      deletedAt: new Date(),
    });
    return !!result;
  }

  // Performance
  async addPerformance(
    data: Partial<PerformanceDocument>,
  ): Promise<PerformanceDocument> {
    return await PerformanceModel.create(data);
  }

  async getPerformanceHistory(
    studentId: string,
    limit = 30,
  ): Promise<PerformanceDocument[]> {
    return await PerformanceModel.find({ studentId })
      .sort({ sessionDate: -1 })
      .limit(limit);
  }

  // Attendance
  async markAttendance(
    data: Partial<AttendanceDocument>,
  ): Promise<AttendanceDocument> {
    return await AttendanceModel.create(data);
  }

  async getAttendanceHistory(
    studentId: string,
    limit = 30,
  ): Promise<AttendanceDocument[]> {
    return await AttendanceModel.find({ studentId })
      .sort({ sessionDate: -1 })
      .limit(limit);
  }

  // Coach Remarks
  async addRemark(
    data: Partial<CoachRemarkDocument>,
  ): Promise<CoachRemarkDocument> {
    return await CoachRemarkModel.create(data);
  }

  async getRemarks(studentId: string): Promise<CoachRemarkDocument[]> {
    return await CoachRemarkModel.find({ studentId }).sort({ date: -1 });
  }

  private toEntity(doc: any): StudentEntity {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      franchiseId: doc.franchiseId.toString(),
      teamId: doc.teamId?.toString(),
      coachId: doc.coachId?.toString(),
      guardianIds: doc.guardianIds?.map((id: any) => id.toString()) || [],
      guardian: doc.guardian,
      firstName: doc.firstName,
      lastName: doc.lastName,
      dateOfBirth: doc.dateOfBirth,
      ageGroup: doc.ageGroup,
      jerseyNumber: doc.jerseyNumber,
      jerseySize: doc.jerseySize,
      position: doc.position,
      photo: doc.photo,
      medicalInfo: doc.medicalInfo,
      enrollmentDate: doc.enrollmentDate,
      isActive: doc.isActive,
      attendancePercentage: doc.attendancePercentage,
      overallRating: doc.overallRating,
      selectionStatus: doc.selectionStatus,
      selectionPhase: doc.selectionPhase,
      selectionFeedback: doc.selectionFeedback,
      transferStatus: doc.transferStatus,
      transferPrice: doc.transferPrice,
      transferListedAt: doc.transferListedAt,
      transferNote: doc.transferNote,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      deletedAt: doc.deletedAt,
    };
  }
}
