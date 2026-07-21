// src/interfaces/http/routes/guardian.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";

export const guardianRouter = Router();

// Every route here is guardian-only, and every use-case call is further
// scoped to req.user.sub so a guardian can only ever see their own children.
guardianRouter.use(authenticate, authorize("guardian"));

guardianRouter.get("/dashboard", (req, res, next) => {
  req.app.locals.controllers.guardian.getDashboard(req, res, next);
});

guardianRouter.get("/children", (req, res, next) => {
  req.app.locals.controllers.guardian.getMyChildren(req, res, next);
});

guardianRouter.get("/children/:studentId", (req, res, next) => {
  req.app.locals.controllers.guardian.getChildProfile(req, res, next);
});

guardianRouter.get("/children/:studentId/attendance", (req, res, next) => {
  req.app.locals.controllers.guardian.getChildAttendance(req, res, next);
});

guardianRouter.get("/children/:studentId/fees", (req, res, next) => {
  req.app.locals.controllers.guardian.getChildFees(req, res, next);
});

guardianRouter.get("/children/:studentId/performance", (req, res, next) => {
  req.app.locals.controllers.guardian.getChildPerformance(req, res, next);
});
