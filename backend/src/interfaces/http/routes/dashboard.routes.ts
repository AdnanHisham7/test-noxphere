// src/interfaces/http/routes/dashboard.routes.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get("/stats", (req, res, next) => {
  req.app.locals.controllers.dashboard.getStats(req, res, next);
});
dashboardRouter.get("/attendance-trend", (req, res, next) => {
  req.app.locals.controllers.dashboard.getAttendanceTrend(req, res, next);
});
dashboardRouter.get("/skill-radar", (req, res, next) => {
  req.app.locals.controllers.dashboard.getSkillRadar(req, res, next);
});
dashboardRouter.get("/team-health", (req, res, next) => {
  req.app.locals.controllers.dashboard.getTeamHealth(req, res, next);
});
dashboardRouter.get("/top-performers", (req, res, next) => {
  req.app.locals.controllers.dashboard.getTopPerformers(req, res, next);
});
dashboardRouter.get("/recent-activity", (req, res, next) => {
  req.app.locals.controllers.dashboard.getRecentActivity(req, res, next);
});
