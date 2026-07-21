import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  CreateAcademySchema,
  UpdateAcademySchema,
  AcademyConfigSchema,
} from "../../../application/dtos/academy.dto";

export const academyRouter = Router();

// All routes require authentication
academyRouter.use(authenticate);

// Public read (any authenticated user)
academyRouter.get("/", (req, res, next) => {
  req.app.locals.controllers.academy.getAll(req, res, next);
});
academyRouter.get("/:id", (req, res, next) => {
  req.app.locals.controllers.academy.getById(req, res, next);
});

// Write operations require super_admin role
academyRouter.post(
  "/",
  authorize("super_admin"),
  validate(CreateAcademySchema),
  (req, res, next) => {
    req.app.locals.controllers.academy.create(req, res, next);
  },
);

academyRouter.put(
  "/:id",
  authorize("super_admin"),
  validate(UpdateAcademySchema),
  (req, res, next) => {
    req.app.locals.controllers.academy.update(req, res, next);
  },
);

// Config updates (which includes skillParameters) may also be made by a
// manager, but only for their own academy — ownership is enforced inside
// AcademyUseCases.updateAcademyConfig, not here, since it requires
// resolving the manager's franchise -> academy relationship.
academyRouter.patch(
  "/:id/config",
  authorize("super_admin", "manager"),
  validate(AcademyConfigSchema),
  (req, res, next) => {
    req.app.locals.controllers.academy.updateConfig(req, res, next);
  },
);

academyRouter.patch(
  "/:id/toggle-status",
  authorize("super_admin"),
  (req, res, next) => {
    req.app.locals.controllers.academy.toggleStatus(req, res, next);
  },
);

academyRouter.delete("/:id", authorize("super_admin"), (req, res, next) => {
  req.app.locals.controllers.academy.delete(req, res, next);
});