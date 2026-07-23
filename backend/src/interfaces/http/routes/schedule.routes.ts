// src/interfaces/http/routes/schedule.routes.ts
import { Router } from "express";
import { authenticate, requirePermission, enforceCoachOwnFranchise } from "../middleware/auth.middleware";

export const scheduleRouter = Router();

scheduleRouter.use(authenticate);

scheduleRouter.get("/", enforceCoachOwnFranchise, (req, res, next) => {
  req.app.locals.controllers.schedule.list(req, res, next);
});
scheduleRouter.get("/:id", (req, res, next) => {
  req.app.locals.controllers.schedule.getById(req, res, next);
});
scheduleRouter.post("/", requirePermission("canManageSessions"), enforceCoachOwnFranchise, (req, res, next) => {
  req.app.locals.controllers.schedule.create(req, res, next);
});
scheduleRouter.put("/:id", requirePermission("canManageSessions"), (req, res, next) => {
  req.app.locals.controllers.schedule.update(req, res, next);
});
scheduleRouter.patch("/:id/cancel", requirePermission("canManageSessions"), (req, res, next) => {
  req.app.locals.controllers.schedule.cancel(req, res, next);
});
scheduleRouter.patch("/:id/location", requirePermission("canManageSessions"), (req, res, next) => {
  req.app.locals.controllers.schedule.changeLocation(req, res, next);
});
scheduleRouter.delete("/:id", requirePermission("canManageFranchises"), (req, res, next) => {
  req.app.locals.controllers.schedule.delete(req, res, next);
});
scheduleRouter.post("/alert-guardians", requirePermission("canSendNotifications"), (req, res, next) => {
  req.app.locals.controllers.schedule.alertAllGuardians(req, res, next);
});
scheduleRouter.get("/:id/roster", (req, res, next) => {
  req.app.locals.controllers.schedule.getRoster(req, res, next);
});
scheduleRouter.post("/:id/attendance", requirePermission("canManageAttendance"), (req, res, next) => {
  req.app.locals.controllers.schedule.markAttendance(req, res, next);
});
scheduleRouter.post("/:id/performance", requirePermission("canManagePerformance"), (req, res, next) => {
  req.app.locals.controllers.schedule.logPerformance(req, res, next);
});