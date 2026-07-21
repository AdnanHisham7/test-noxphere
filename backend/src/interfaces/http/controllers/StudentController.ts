import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { StudentUseCases } from '../../../application/use-cases/student/StudentUseCases';
import { ResponseHandler } from '../../../shared/utils/ResponseHandler';
import { CreateStudentSchema, UpdateStudentSchema, AddCoachRemarkSchema, ListOnTransferSchema } from '../../../application/dtos/student.dto';

export class StudentController {
  constructor(private studentUseCases: StudentUseCases) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = CreateStudentSchema.parse(req.body);
      const student = await this.studentUseCases.createStudent(dto, req.user!.sub);
      ResponseHandler.created(res, student, 'Student enrolled successfully');
    } catch (err) { next(err); }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.query;
      if (!franchiseId) throw new Error('franchiseId is required');
      const { page = 1, limit = 20, search, teamId, ageGroup, selectionStatus } = req.query;
      const result = await this.studentUseCases.getStudents(
        franchiseId as string,
        { search, teamId, ageGroup, selectionStatus },
        Number(page),
        Number(limit),
      );
      ResponseHandler.success(res, result, 'Students retrieved');
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await this.studentUseCases.getStudentById(req.params.id);
      ResponseHandler.success(res, student, 'Student retrieved');
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateStudentSchema.parse(req.body);
      const student = await this.studentUseCases.updateStudent(req.params.id, dto);
      ResponseHandler.success(res, student, 'Student updated');
    } catch (err) { next(err); }
  };

  updatePhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { photo } = z.object({ photo: z.string().url() }).parse(req.body);
      const student = await this.studentUseCases.updateStudentPhoto(req.params.id, photo);
      ResponseHandler.success(res, student, 'Photo updated');
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.studentUseCases.deleteStudent(req.params.id);
      ResponseHandler.noContent(res, 'Student deleted');
    } catch (err) { next(err); }
  };

  // NOTE: freeform per-student addPerformance/markAttendance endpoints used
  // to live here. Attendance/performance can now only be recorded against
  // a real scheduled session — see ScheduleController.markAttendance /
  // logPerformance (POST /schedule/:id/attendance, /schedule/:id/performance).

  addCoachRemark = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = AddCoachRemarkSchema.parse(req.body);
      const remark = await this.studentUseCases.addCoachRemark(req.params.id, dto, req.user!.sub);
      ResponseHandler.success(res, remark, 'Remark added');
    } catch (err) { next(err); }
  };

  listOnTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = ListOnTransferSchema.parse(req.body);
      const student = await this.studentUseCases.listOnTransferWall(req.params.id, dto);
      ResponseHandler.success(res, student, 'Student listed on transfer wall');
    } catch (err) { next(err); }
  };

  getPlayerCard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.studentUseCases.getPlayerCard(req.params.id);
      ResponseHandler.success(res, data, 'Player card data');
    } catch (err) { next(err); }
  };
}