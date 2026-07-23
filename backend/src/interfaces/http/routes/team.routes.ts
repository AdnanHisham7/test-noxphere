import { Router } from "express";
import { authenticate, requirePermission, enforceCoachOwnFranchise } from "../middleware/auth.middleware";

export const teamRouter = Router();

teamRouter.post("/", authenticate, requirePermission("canManageFranchises"), (req, res, next) => {
  req.app.locals.controllers.team.create(req, res, next);
});
teamRouter.get("/", authenticate, enforceCoachOwnFranchise, (req, res, next) => {
  req.app.locals.controllers.team.list(req, res, next);
});
teamRouter.get("/:id", authenticate, (req, res, next) => {
  req.app.locals.controllers.team.getById(req, res, next);
});
teamRouter.put("/:id", authenticate, requirePermission("canManageFranchises"), (req, res, next) => {
  req.app.locals.controllers.team.update(req, res, next);
});
teamRouter.delete("/:id", authenticate, requirePermission("canManageFranchises"), (req, res, next) => {
  req.app.locals.controllers.team.delete(req, res, next);
});