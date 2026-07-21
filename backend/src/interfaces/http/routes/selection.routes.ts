// src/interfaces/http/routes/selection.routes.ts
import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware";

export const selectionRouter = Router();

selectionRouter.use(authenticate);

selectionRouter.get("/", (req, res, next) => {
  req.app.locals.controllers.selection.list(req, res, next);
});
selectionRouter.patch("/:id/status", requirePermission("canManageSelection"), (req, res, next) => {
  req.app.locals.controllers.selection.updateStatus(req, res, next);
});
selectionRouter.post("/notify", requirePermission("canManageSelection"), (req, res, next) => {
  req.app.locals.controllers.selection.notifyAll(req, res, next);
});
