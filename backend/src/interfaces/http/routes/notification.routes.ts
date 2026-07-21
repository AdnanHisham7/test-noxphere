import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware";

export const notificationRouter = Router();

notificationRouter.post("/", authenticate, requirePermission("canSendNotifications"), (req, res, next) => {
  req.app.locals.controllers.notification.create(req, res, next);
});
notificationRouter.get("/", authenticate, (req, res, next) => {
  req.app.locals.controllers.notification.list(req, res, next);
});
notificationRouter.patch("/:id/read", authenticate, (req, res, next) => {
  req.app.locals.controllers.notification.markRead(req, res, next);
});
