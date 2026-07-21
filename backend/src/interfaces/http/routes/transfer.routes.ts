// src/interfaces/http/routes/transfer.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

export const transferRouter = Router();

// Public routes
transferRouter.get('/', (req, res, next) => {
  (req.app.locals.controllers.transfer as any).getPublicListings(req, res, next);
});
transferRouter.get('/:id', (req, res, next) => {
  (req.app.locals.controllers.transfer as any).getListingById(req, res, next);
});

// Protected routes (managers only)
transferRouter.post('/students/:studentId/list', authenticate, (req, res, next) => {
  (req.app.locals.controllers.transfer as any).listPlayer(req, res, next);
});
transferRouter.put('/:id', authenticate, (req, res, next) => {
  (req.app.locals.controllers.transfer as any).updateListing(req, res, next);
});
transferRouter.delete('/:id', authenticate, (req, res, next) => {
  (req.app.locals.controllers.transfer as any).removeListing(req, res, next);
});
transferRouter.post('/request', authenticate, (req, res, next) => {
  (req.app.locals.controllers.transfer as any).requestTransfer(req, res, next);
});
transferRouter.put('/requests/:requestId/respond', authenticate, (req, res, next) => {
  (req.app.locals.controllers.transfer as any).respondToTransfer(req, res, next);
});
transferRouter.get('/my/listings', authenticate, (req, res, next) => {
  (req.app.locals.controllers.transfer as any).getMyListings(req, res, next);
});
transferRouter.get('/my/requests/incoming', authenticate, (req, res, next) => {
  (req.app.locals.controllers.transfer as any).getIncomingRequests(req, res, next);
});
transferRouter.get('/my/requests/outgoing', authenticate, (req, res, next) => {
  (req.app.locals.controllers.transfer as any).getOutgoingRequests(req, res, next);
});