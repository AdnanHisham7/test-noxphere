// src/interfaces/http/routes/attendance.routes.ts
//
// Marking attendance now happens exclusively via
// POST /schedule/:id/attendance (see schedule.routes.ts). This router is
// read-only: attendance history/reporting across sessions and date ranges.
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";

export const attendanceRouter = Router();

attendanceRouter.get("/", authenticate, (req, res, next) => {
  req.app.locals.controllers.attendance.getHistory(req, res, next);
});
