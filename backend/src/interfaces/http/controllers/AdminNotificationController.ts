import { Request, Response, NextFunction } from "express";
import { AdminNotificationUseCases } from "../../../application/use-cases/notification/AdminNotificationUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";
import { BadRequestError } from "../../../shared/errors/AppError";

export class AdminNotificationController {
  constructor(private notificationUseCases: AdminNotificationUseCases) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId, title, body, audience, teamId } = req.body;
      if (!franchiseId || !title || !body || !audience) {
        throw new BadRequestError("franchiseId, title, body and audience are required");
      }
      const notification = await this.notificationUseCases.create(
        { franchiseId, title, body, audience, teamId },
        req.user!.sub,
      );
      ResponseHandler.created(res, notification, "Notification sent");
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId, page = 1, limit = 20 } = req.query;
      if (!franchiseId) throw new BadRequestError("franchiseId is required");
      const result = await this.notificationUseCases.list(franchiseId as string, Number(page), Number(limit));
      ResponseHandler.success(res, result, "Notifications retrieved");
    } catch (err) {
      next(err);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await this.notificationUseCases.markRead(req.params.id, req.user!.sub);
      ResponseHandler.success(res, notification, "Marked as read");
    } catch (err) {
      next(err);
    }
  };
}
