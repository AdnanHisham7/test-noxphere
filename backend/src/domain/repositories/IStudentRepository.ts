import { StudentEntity } from '../entities/Student.entity';
import { PerformanceDocument } from '../../infrastructure/database/models/Performance.model';
import { AttendanceDocument } from '../../infrastructure/database/models/Attendance.model';
import { CoachRemarkDocument } from '../../infrastructure/database/models/CoachRemark.model';

export interface IStudentRepository {
  // Student CRUD
  create(data: Partial<StudentEntity>): Promise<StudentEntity>;
  findById(id: string): Promise<StudentEntity | null>;
  findAll(filter: any, page: number, limit: number): Promise<{ items: StudentEntity[]; total: number }>;
  update(id: string, data: Partial<StudentEntity>): Promise<StudentEntity | null>;
  delete(id: string): Promise<boolean>;
  
  // Performance
  addPerformance(data: Partial<PerformanceDocument>): Promise<PerformanceDocument>;
  getPerformanceHistory(studentId: string, limit?: number): Promise<PerformanceDocument[]>;
  
  // Attendance
  markAttendance(data: Partial<AttendanceDocument>): Promise<AttendanceDocument>;
  getAttendanceHistory(studentId: string, limit?: number): Promise<AttendanceDocument[]>;
  
  // Coach Remarks
  addRemark(data: Partial<CoachRemarkDocument>): Promise<CoachRemarkDocument>;
  getRemarks(studentId: string): Promise<CoachRemarkDocument[]>;
}