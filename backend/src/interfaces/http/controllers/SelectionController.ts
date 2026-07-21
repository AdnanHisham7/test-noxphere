// src/interfaces/http/controllers/SelectionController.ts
import { Request, Response, NextFunction } from "express";
import { SelectionUseCases } from "../../../application/use-cases/selection/SelectionUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";
import { BadRequestError } from "../../../shared/errors/AppError";
import { UpdateSelectionStatusSchema, NotifySelectionSchema } from "../../../application/dtos/selection.dto";

export class SelectionController {
  constructor(private readonly selectionUseCases: SelectionUseCases) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { franchiseId, phase, ageGroup } = req.query;
      if (!franchiseId) throw new BadRequestError("franchiseId is required");
      const result = await this.selectionUseCases.listForSelection(
        franchiseId as string,
        phase as string,
        ageGroup as string,
      );
      ResponseHandler.success(res, result, "Selection list retrieved");
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateSelectionStatusSchema.parse(req.body);
      const result = await this.selectionUseCases.updateStatus(req.params.id, dto, req.user!.sub);
      ResponseHandler.success(res, result, "Selection status updated");
    } catch (err) {
      next(err);
    }
  };

  notifyAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = NotifySelectionSchema.parse(req.body);
      const result = await this.selectionUseCases.notifyAll(dto, req.user!.sub);
      ResponseHandler.success(res, result, "Guardians notified");
    } catch (err) {
      next(err);
    }
  };
}
