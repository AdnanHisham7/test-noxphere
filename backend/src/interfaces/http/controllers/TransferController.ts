// src/interfaces/http/controllers/TransferController.ts
import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../../../shared/utils/ResponseHandler';

export class TransferController {
  constructor(private readonly transferUseCases: any) {}

  // Public endpoint - no auth required
  getPublicListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = '1', limit = '20', search, minRating, maxPrice, position, ageGroup } = req.query;
      const result = await this.transferUseCases.getPublicListings({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        position: position as string,
        ageGroup: ageGroup as string,
      });
      ResponseHandler.paginated(res, result.data, result.total, result.page, result.limit, 'Transfer wall listings');
    } catch (err) {
      next(err);
    }
  };

  getListingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.transferUseCases.getListingById(id);
      ResponseHandler.success(res, result);
    } catch (err) {
      next(err);
    }
  };

  listPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId } = req.params;
      const result = await this.transferUseCases.listPlayer({
        studentId,
        managerId: req.user!.sub,
        ...req.body,
      });
      ResponseHandler.created(res, result, 'Player listed on transfer wall');
    } catch (err) {
      next(err);
    }
  };

  updateListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.transferUseCases.updateListing(id, req.user!.sub, req.body);
      ResponseHandler.success(res, result, 'Listing updated');
    } catch (err) {
      next(err);
    }
  };

  removeListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.transferUseCases.removeListing(id, req.user!.sub);
      ResponseHandler.noContent(res, 'Player removed from transfer wall');
    } catch (err) {
      next(err);
    }
  };

  requestTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.transferUseCases.requestTransfer({
        ...req.body,
        toManagerId: req.user!.sub,
      });
      ResponseHandler.created(res, result, 'Transfer request submitted');
    } catch (err) {
      next(err);
    }
  };

  respondToTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { requestId } = req.params;
      const { action, responseNote } = req.body; // action: 'accept' | 'reject'
      const result = await this.transferUseCases.respondToTransfer(
        requestId,
        req.user!.sub,
        action,
        responseNote
      );
      ResponseHandler.success(res, result, `Transfer request ${action}ed`);
    } catch (err) {
      next(err);
    }
  };

  getMyListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = '1', limit = '20' } = req.query;
      const result = await this.transferUseCases.getManagerListings(req.user!.sub, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
      ResponseHandler.paginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) {
      next(err);
    }
  };

  getIncomingRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.transferUseCases.getIncomingRequests(req.user!.sub);
      ResponseHandler.success(res, result);
    } catch (err) {
      next(err);
    }
  };

  getOutgoingRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.transferUseCases.getOutgoingRequests(req.user!.sub);
      ResponseHandler.success(res, result);
    } catch (err) {
      next(err);
    }
  };
}
