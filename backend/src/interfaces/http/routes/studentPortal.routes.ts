// src/interfaces/http/routes/studentPortal.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";

export const studentPortalRouter = Router();

// "/me" — a student can only ever read their own record. No :id params here
// on purpose: the use-case layer resolves the student from the JWT subject.
studentPortalRouter.use(authenticate, authorize("student"));

studentPortalRouter.get("/dashboard", (req, res, next) => {
  req.app.locals.controllers.studentPortal.getMyDashboard(req, res, next);
});

studentPortalRouter.get("/profile", (req, res, next) => {
  req.app.locals.controllers.studentPortal.getMyProfile(req, res, next);
});

studentPortalRouter.get("/attendance", (req, res, next) => {
  req.app.locals.controllers.studentPortal.getMyAttendance(req, res, next);
});

studentPortalRouter.get("/fees", (req, res, next) => {
  req.app.locals.controllers.studentPortal.getMyFees(req, res, next);
});

studentPortalRouter.get("/performance", (req, res, next) => {
  req.app.locals.controllers.studentPortal.getMyPerformance(req, res, next);
});
