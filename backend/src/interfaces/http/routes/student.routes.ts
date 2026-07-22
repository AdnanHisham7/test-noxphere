import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';

export const studentRouter = Router();

// These will be bound to controller instance from app.locals
studentRouter.post('/', authenticate, requirePermission('canManageFranchises'), (req, res, next) => {
  req.app.locals.controllers.student.create(req, res, next);
});
studentRouter.get('/', authenticate, (req, res, next) => {
  req.app.locals.controllers.student.list(req, res, next);
});
studentRouter.get('/:id', authenticate, (req, res, next) => {
  req.app.locals.controllers.student.getById(req, res, next);
});
studentRouter.put('/:id', authenticate, requirePermission('canManageFranchises'), (req, res, next) => {
  req.app.locals.controllers.student.update(req, res, next);
});
studentRouter.patch('/:id/photo', authenticate, requirePermission('canManagePerformance'), (req, res, next) => {
  req.app.locals.controllers.student.updatePhoto(req, res, next);
});
studentRouter.delete('/:id', authenticate, requirePermission('canManageFranchises'), (req, res, next) => {
  req.app.locals.controllers.student.delete(req, res, next);
});

// Attendance/Performance are now only recorded against a real scheduled
// session — see /schedule/:id/attendance and /schedule/:id/performance.

// Coach Remarks
studentRouter.post('/:id/remarks', authenticate, requirePermission('canManagePerformance'), (req, res, next) => {
  req.app.locals.controllers.student.addCoachRemark(req, res, next);
});

// Player Card (public? use authentication)
studentRouter.get('/:id/playercard', authenticate, (req, res, next) => {
  req.app.locals.controllers.student.getPlayerCard(req, res, next);
});