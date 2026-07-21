import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware";

export const feesRouter = Router();

feesRouter.post("/", authenticate, requirePermission("canManageFinance"), (req, res, next) => {
  req.app.locals.controllers.fees.create(req, res, next);
});
feesRouter.get("/", authenticate, requirePermission("canManageFinance"), (req, res, next) => {
  req.app.locals.controllers.fees.list(req, res, next);
});
feesRouter.get("/:id", authenticate, requirePermission("canManageFinance"), (req, res, next) => {
  req.app.locals.controllers.fees.getById(req, res, next);
});
feesRouter.post(
  "/:id/installments/:installmentNumber/pay",
  authenticate,
  requirePermission("canManageFinance"),
  (req, res, next) => {
    req.app.locals.controllers.fees.recordPayment(req, res, next);
  },
);
