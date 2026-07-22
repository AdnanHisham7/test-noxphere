// src/interfaces/http/routes/resource.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { BadRequestError } from "../../../shared/errors/AppError";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_RESOURCE_BYTES = 20 * 1024 * 1024; // 20MB per file

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESOURCE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Only PDF, JPEG, PNG, WEBP or GIF files are allowed"));
      return;
    }
    cb(null, true);
  },
});

function singleResourceFile(req: Request, res: Response, next: NextFunction) {
  upload.single("file")(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      next(new BadRequestError(`File is too large — the limit is ${MAX_RESOURCE_BYTES / (1024 * 1024)}MB`));
      return;
    }
    next(new BadRequestError(err instanceof Error ? err.message : "Couldn't process the uploaded file"));
  });
}

export const resourceRouter = Router();

resourceRouter.use(authenticate);

resourceRouter.get("/", authorize("manager", "coach", "super_admin"), (req, res, next) => {
  req.app.locals.controllers.resource.list(req, res, next);
});

resourceRouter.post("/", authorize("manager", "coach"), singleResourceFile, (req, res, next) => {
  req.app.locals.controllers.resource.upload(req, res, next);
});

resourceRouter.patch("/:id/verify", authorize("manager"), (req, res, next) => {
  req.app.locals.controllers.resource.verify(req, res, next);
});

resourceRouter.delete("/:id", authorize("manager", "coach"), (req, res, next) => {
  req.app.locals.controllers.resource.delete(req, res, next);
});