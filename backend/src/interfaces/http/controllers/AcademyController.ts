import { Request, Response, NextFunction } from 'express';
import { AcademyUseCases } from '../../../application/use-cases/academy/AcademyUseCases';
import { ResponseHandler } from '../../../shared/utils/ResponseHandler';
import {
  CreateAcademySchema,
  UpdateAcademySchema,
  AcademyConfigSchema,
} from '../../../application/dtos/academy.dto';
import { NotFoundError } from '../../../shared/errors/AppError';

export class AcademyController {
  constructor(private readonly academyUseCases: AcademyUseCases) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateAcademySchema.parse(req.body);
      const academy = await this.academyUseCases.createAcademy(dto);
      ResponseHandler.created(res, academy, 'Academy created successfully');
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const academy = await this.academyUseCases.getAcademyById(id);
      ResponseHandler.success(res, academy);
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { isActive, search, page = '1', limit = '20' } = req.query;
      const result = await this.academyUseCases.getAllAcademies(
        { isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined, search: search as string },
        parseInt(page as string),
        parseInt(limit as string)
      );
      ResponseHandler.success(res, result);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto = UpdateAcademySchema.parse(req.body);
      const academy = await this.academyUseCases.updateAcademy(id, dto);
      ResponseHandler.success(res, academy, 'Academy updated successfully');
    } catch (err) {
      next(err);
    }
  };

  updateConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto = AcademyConfigSchema.parse(req.body);
      const academy = await this.academyUseCases.updateAcademyConfig(id, dto, {
        role: req.user!.role,
        franchiseId: req.user!.franchiseId,
      });
      ResponseHandler.success(res, academy, 'Configuration updated successfully');
    } catch (err) {
      next(err);
    }
  };

  toggleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const academy = await this.academyUseCases.toggleAcademyStatus(id);
      ResponseHandler.success(res, academy, `Academy ${academy.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      next(err);
    }
  };

  toggleTransferWall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const academy = await this.academyUseCases.toggleTransferWall(id);
      ResponseHandler.success(
        res,
        academy,
        `Transfer wall ${academy.transferWallEnabled ? 'enabled' : 'disabled'}`,
      );
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.academyUseCases.deleteAcademy(id);
      ResponseHandler.success(res, null, 'Academy deleted successfully');
    } catch (err) {
      next(err);
    }
  };
}