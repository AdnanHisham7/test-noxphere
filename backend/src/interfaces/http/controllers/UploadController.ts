// src/interfaces/http/controllers/UploadController.ts
import { Request, Response, NextFunction } from "express";
import { UploadImageSchema } from "../../../application/dtos/upload.dto";
import { CloudinaryService } from "../../../infrastructure/services/CloudinaryService";
import { BadRequestError } from "../../../shared/errors/AppError";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";

export class UploadController {
  constructor(private cloudinaryService: CloudinaryService) {}

  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) throw new BadRequestError("An image file is required");
      const { category } = UploadImageSchema.parse(req.body);
      const result = await this.cloudinaryService.uploadBuffer(req.file.buffer, category, req.file.originalname);
      ResponseHandler.created(res, { url: result.url, publicId: result.publicId }, "Image uploaded");
    } catch (err) {
      next(err);
    }
  };
}