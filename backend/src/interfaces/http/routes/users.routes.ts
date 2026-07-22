// src/interfaces/http/routes/users.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";

export const usersRouter = Router();

usersRouter.use(authenticate, authorize("super_admin", "manager"));

usersRouter.get("/", (req, res, next) => {
  req.app.locals.controllers.users.list(req, res, next);
});
usersRouter.get("/:id", (req, res, next) => {
  req.app.locals.controllers.users.getById(req, res, next);
});
usersRouter.post("/", authorize("super_admin", "manager"), (req, res, next) => {
  req.app.locals.controllers.users.create(req, res, next);
});
usersRouter.put("/:id", authorize("super_admin", "manager"), (req, res, next) => {
  req.app.locals.controllers.users.update(req, res, next);
});
usersRouter.patch("/:id/toggle-active", authorize("super_admin", "manager"), (req, res, next) => {
  req.app.locals.controllers.users.toggleActive(req, res, next);
});
usersRouter.patch("/:id/reset-password", authorize("super_admin", "manager"), (req, res, next) => {
  req.app.locals.controllers.users.resetPassword(req, res, next);
});
usersRouter.delete("/:id", authorize("super_admin"), (req, res, next) => {
  req.app.locals.controllers.users.delete(req, res, next);
});
