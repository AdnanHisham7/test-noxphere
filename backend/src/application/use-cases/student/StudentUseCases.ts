import { IStudentRepository } from "../../../domain/repositories/IStudentRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { StudentEntity } from "../../../domain/entities/Student.entity";
import {
  defaultPermissions,
  UserEntity,
  UserRole,
} from "../../../domain/entities/User.entity";
import {
  AppError,
  NotFoundError,
  ConflictError,
} from "../../../shared/errors/AppError";
import {
  CreateStudentDto,
  UpdateStudentDto,
  AddCoachRemarkDto,
} from "../../dtos/student.dto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { CoachRemarkModel } from "../../../infrastructure/database/models/CoachRemark.model";

export class StudentUseCases {
  constructor(
    private studentRepo: IStudentRepository,
    private userRepo: IUserRepository,
  ) {}

  async createStudent(
    dto: CreateStudentDto,
    createdBy: string,
  ): Promise<StudentEntity> {
    // 1. Create (or reuse) a guardian-role account for the guardian's email.
    // This is what the Guardian Portal logs into, and it's what every
    // guardian notification (schedule alerts, selection updates, fee
    // reminders, attendance/performance) is addressed to via
    // student.guardianIds.
    let guardianUser = await this.userRepo.findByEmail(dto.guardian.email);
    if (!guardianUser) {
      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const [guardianFirstName, ...guardianLastParts] = dto.guardian.name.trim().split(" ");
      guardianUser = await this.userRepo.create({
        email: dto.guardian.email,
        passwordHash,
        role: "guardian",
        firstName: guardianFirstName || dto.guardian.name,
        lastName: guardianLastParts.join(" ") || "-",
        phone: dto.guardian.phone,
        isActive: true,
        isEmailVerified: false,
        permissions: defaultPermissions["guardian" as UserRole],
        fcmTokens: [],
        franchiseId: dto.franchiseId,
      });
      // TODO: Send email with temp password
    }

    // 2. Create a separate student-role account for the player themself.
    // `dto.email` is usually the same as the guardian's email in youth
    // academies (players rarely have their own inbox) — in that case we
    // don't want to collide with the guardian account we just created, so
    // we derive a distinct, non-loginable placeholder address instead. An
    // admin can later give the player their own real login email via
    // profile edit once they're old enough to want one.
    const studentEmail =
      dto.email.trim().toLowerCase() === dto.guardian.email.trim().toLowerCase()
        ? `student.${new mongoose.Types.ObjectId().toHexString()}@accounts.internal`
        : dto.email;

    let studentUser = await this.userRepo.findByEmail(studentEmail);
    if (!studentUser) {
      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      studentUser = await this.userRepo.create({
        email: studentEmail,
        passwordHash,
        role: "student",
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.guardian.phone,
        isActive: true,
        isEmailVerified: false,
        permissions: defaultPermissions["student" as UserRole],
        fcmTokens: [],
        franchiseId: dto.franchiseId,
      });
      // TODO: Send email with temp password
    }

    // 3. Create student document, linked to both accounts
    const studentData: Partial<StudentEntity> = {
      userId: studentUser.id,
      franchiseId: dto.franchiseId,
      teamId: dto.teamId,
      coachId: dto.coachId,
      guardianIds: [guardianUser.id],
      guardian: dto.guardian,
      firstName: dto.firstName,
      lastName: dto.lastName,
      dateOfBirth: new Date(dto.dateOfBirth),
      ageGroup: dto.ageGroup,
      jerseyNumber: dto.jerseyNumber,
      jerseySize: dto.jerseySize,
      position: dto.position,
      photo: dto.photo,
      medicalInfo: dto.medicalInfo,
      enrollmentDate: new Date(),
      isActive: true,
      attendancePercentage: 0,
      overallRating: 0,
      selectionStatus: "pending",
      transferStatus: "not_listed",
    };
    return await this.studentRepo.create(studentData);
  }

  async getStudents(
    franchiseId: string,
    filters: any,
    page = 1,
    limit = 20,
  ): Promise<{ items: StudentEntity[]; total: number }> {
    const filter: any = { franchiseId, isActive: true };
    if (filters.teamId) filter.teamId = filters.teamId;
    if (filters.ageGroup) filter.ageGroup = filters.ageGroup;
    if (filters.selectionStatus)
      filter.selectionStatus = filters.selectionStatus;
    if (filters.search) {
      filter.$or = [
        { firstName: { $regex: filters.search, $options: "i" } },
        { lastName: { $regex: filters.search, $options: "i" } },
      ];
    }
    return await this.studentRepo.findAll(filter, page, limit);
  }

  async getStudentById(id: string): Promise<StudentEntity> {
    const student = await this.studentRepo.findById(id);
    if (!student) throw new NotFoundError("Student");
    return student;
  }

  async updateStudentPhoto(id: string, photo: string): Promise<StudentEntity> {
    const student = await this.studentRepo.update(id, { photo });
    if (!student) throw new NotFoundError("Student");
    return student;
  }

  async updateStudent(
    id: string,
    dto: UpdateStudentDto,
  ): Promise<StudentEntity> {
    const { dateOfBirth, ...rest } = dto;
    const updateData: Partial<StudentEntity> = {
      ...rest,
    };
    if (dateOfBirth) {
      updateData.dateOfBirth = new Date(dateOfBirth);
    }
    const student = await this.studentRepo.update(id, updateData);
    if (!student) throw new NotFoundError("Student");
    return student;
  }

  async deleteStudent(id: string): Promise<void> {
    const success = await this.studentRepo.delete(id);
    if (!success) throw new NotFoundError("Student");
  }

  // NOTE: freeform per-student addPerformance()/markAttendance() methods
  // used to live here, letting attendance/performance be recorded for any
  // date with no link to a real scheduled session. That's been replaced —
  // both are now only recordable against a real Session via
  // ScheduleUseCases.markSessionAttendance() / logSessionPerformance(),
  // reached through POST /schedule/:id/attendance and
  // POST /schedule/:id/performance. See getPlayerCard() below for reading
  // a student's attendance/performance history.

  async addCoachRemark(
    studentId: string,
    dto: AddCoachRemarkDto,
    coachId: string,
  ): Promise<any> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) throw new NotFoundError("Student");
    return await this.studentRepo.addRemark({
      studentId: new mongoose.Types.ObjectId(studentId),
      coachId: new mongoose.Types.ObjectId(coachId),
      text: dto.text,
      date: new Date(),
    });
  }

  async getPlayerCard(studentId: string): Promise<any> {
    const student = await this.getStudentById(studentId);
    const performances = await this.studentRepo.getPerformanceHistory(
      studentId,
      10,
    );
    const attendance = await this.studentRepo.getAttendanceHistory(
      studentId,
      30,
    );
    const remarks = await this.studentRepo.getRemarks(studentId);
    return { student, performances, attendance, remarks };
  }
}