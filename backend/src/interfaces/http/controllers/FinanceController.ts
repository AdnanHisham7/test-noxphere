// src/interfaces/http/controllers/FinanceController.ts
import { Request, Response, NextFunction } from "express";
import { FinanceUseCases } from "../../../application/use-cases/finance/FinanceUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";

export class FinanceController {
  constructor(private readonly financeUseCases: FinanceUseCases) {}

  getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to, academyId, franchiseId } = req.query;
      const overview = await this.financeUseCases.getOverview({
        from: from as string,
        to: to as string,
        academyId: academyId as string,
        franchiseId: franchiseId as string,
      });
      ResponseHandler.success(res, overview, "Finance overview retrieved");
    } catch (err) {
      next(err);
    }
  };

  getRevenueByMonth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { academyId, franchiseId, months } = req.query;
      const data = await this.financeUseCases.getRevenueByMonth({
        academyId: academyId as string,
        franchiseId: franchiseId as string,
        months: months ? parseInt(months as string) : undefined,
      });
      ResponseHandler.success(res, data, "Monthly revenue retrieved");
    } catch (err) {
      next(err);
    }
  };

  getRevenueByAcademy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.financeUseCases.getRevenueByAcademy();
      ResponseHandler.success(res, data, "Revenue by academy retrieved");
    } catch (err) {
      next(err);
    }
  };

  getOverdueInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { academyId, franchiseId, page = "1", limit = "20" } = req.query;
      const result = await this.financeUseCases.getOverdueInvoices({
        academyId: academyId as string,
        franchiseId: franchiseId as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
      ResponseHandler.paginated(res, result.data, result.total, result.page, result.limit, "Overdue invoices retrieved");
    } catch (err) {
      next(err);
    }
  };

  getRecentTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { academyId, franchiseId, limit = "20" } = req.query;
      const data = await this.financeUseCases.getRecentTransactions({
        academyId: academyId as string,
        franchiseId: franchiseId as string,
        limit: parseInt(limit as string),
      });
      ResponseHandler.success(res, data, "Recent transactions retrieved");
    } catch (err) {
      next(err);
    }
  };
}
