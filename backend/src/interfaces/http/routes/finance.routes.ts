// src/interfaces/http/routes/finance.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";

export const financeRouter = Router();

financeRouter.use(authenticate, authorize("super_admin"));

financeRouter.get("/overview", (req, res, next) => {
  req.app.locals.controllers.finance.getOverview(req, res, next);
});
financeRouter.get("/revenue-by-month", (req, res, next) => {
  req.app.locals.controllers.finance.getRevenueByMonth(req, res, next);
});
financeRouter.get("/revenue-by-academy", (req, res, next) => {
  req.app.locals.controllers.finance.getRevenueByAcademy(req, res, next);
});
financeRouter.get("/overdue", (req, res, next) => {
  req.app.locals.controllers.finance.getOverdueInvoices(req, res, next);
});
financeRouter.get("/transactions", (req, res, next) => {
  req.app.locals.controllers.finance.getRecentTransactions(req, res, next);
});
