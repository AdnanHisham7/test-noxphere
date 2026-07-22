// src/interfaces/http/controllers/ResourceController.ts
import { Request, Response, NextFunction } from "express";
import { ResourceUseCases } from "../../../application/use-cases/resource/ResourceUseCases";
import { UploadResourceSchema } from "../../../application/dtos/resource.dto";
import { BadRequestError } from "../../../shared/errors/AppError";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";

export class ResourceController {
  constructor(private resourceUseCases: ResourceUseCases) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { franchiseId } = req.query;
      if (!franchiseId) throw new BadRequestError("franchiseId is required");

      if (req.user!.role === "manager" || req.user!.role === "super_admin") {
        const result = await this.resourceUseCases.listForManager(franchiseId as string);
        ResponseHandler.success(res, result, "Resources retrieved");
        return;
      }

      const resources = await this.resourceUseCases.listForCoach(franchiseId as string, req.user!.sub);
      ResponseHandler.success(res, { data: resources, storage: null }, "Resources retrieved");
    } catch (err) {
      next(err);
    }
  };

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) throw new BadRequestError("A file is required");
      const { franchiseId } = UploadResourceSchema.parse(req.body);
      const resource = await this.resourceUseCases.uploadResource({
        franchiseId,
        uploadedBy: req.user!.sub,
        uploadedByRole: req.user!.role,
        fileBuffer: req.file.buffer,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSizeBytes: req.file.size,
      });
      ResponseHandler.created(res, resource, "Resource uploaded");
    } catch (err) {
      next(err);
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resource = await this.resourceUseCases.verifyResource(req.params.id, req.user!.sub);
      ResponseHandler.success(res, resource, "Resource verified");
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.resourceUseCases.deleteResource(req.params.id, { id: req.user!.sub, role: req.user!.role });
      ResponseHandler.success(res, null, "Resource removed");
    } catch (err) {
      next(err);
    }
  };
}