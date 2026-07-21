// src/interfaces/http/routes/upload.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware";
import { config } from "../../../config/app.config";
import { BadRequestError } from "../../../shared/errors/AppError";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.cloudinary.maxImageSizeBytes },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, WEBP or GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

function singleImage(req: Request, res: Response, next: NextFunction) {
  upload.single("file")(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      const maxMb = Math.round(config.cloudinary.maxImageSizeBytes / (1024 * 1024));
      next(new BadRequestError(`Image is too large — the limit is ${maxMb}MB`));
      return;
    }
    next(new BadRequestError(err instanceof Error ? err.message : "Couldn't process the uploaded file"));
  });
}

export const uploadRouter = Router();

uploadRouter.use(authenticate);

uploadRouter.post("/image", singleImage, (req, res, next) => {
  req.app.locals.controllers.upload.uploadImage(req, res, next);
});