import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware";

export const performanceRouter = Router();

performanceRouter.get("/", authenticate, requirePermission("canManagePerformance"), (req, res, next) => {
  req.app.locals.controllers.performance.list(req, res, next);
});

// Performance is now only recorded against a real scheduled session:
//   POST /api/v1/schedule/:id/performance
