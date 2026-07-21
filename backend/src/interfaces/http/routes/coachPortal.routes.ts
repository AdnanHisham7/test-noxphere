// src/interfaces/http/routes/coachPortal.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";

export const coachPortalRouter = Router();

coachPortalRouter.use(authenticate, authorize("coach"));

coachPortalRouter.get("/dashboard", (req, res, next) => {
  req.app.locals.controllers.coachPortal.getMyDashboard(req, res, next);
});

coachPortalRouter.get("/roster", (req, res, next) => {
  req.app.locals.controllers.coachPortal.getMyRoster(req, res, next);
});

// Attendance/performance are recorded against a real scheduled session:
//   POST /api/v1/schedule/:id/attendance
//   POST /api/v1/schedule/:id/performance
// Coach remarks (freeform notes) are the one thing that isn't tied to a
// session, and reuse the existing endpoint, already permission-gated:
//   POST /api/v1/students/:id/remarks
