// src/interfaces/http/routes/franchise.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";

export const franchiseRouter = Router();

franchiseRouter.use(authenticate, authorize("super_admin", "manager"));

franchiseRouter.get("/", (req, res, next) => {
  req.app.locals.controllers.franchise.list(req, res, next);
});
franchiseRouter.get("/:id", (req, res, next) => {
  req.app.locals.controllers.franchise.getById(req, res, next);
});
franchiseRouter.post("/", (req, res, next) => {
  req.app.locals.controllers.franchise.create(req, res, next);
});
franchiseRouter.put("/:id", (req, res, next) => {
  req.app.locals.controllers.franchise.update(req, res, next);
});
franchiseRouter.patch("/:id/toggle-active", (req, res, next) => {
  req.app.locals.controllers.franchise.toggleActive(req, res, next);
});
franchiseRouter.delete("/:id", (req, res, next) => {
  req.app.locals.controllers.franchise.delete(req, res, next);
});
