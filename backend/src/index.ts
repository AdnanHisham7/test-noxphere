// src/index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";

import { config } from "./config/app.config";
import { apiRouter } from "./interfaces/http/routes/index";
import { errorHandler } from "./interfaces/http/middleware/errorHandler.middleware";
import { AuthController } from "./interfaces/http/controllers/AuthController";
import { TransferController } from "./interfaces/http/controllers/TransferController";
import { AuthUseCases } from "./application/use-cases/auth/AuthUseCases";
import { logger } from "./shared/utils/logger";
import { StudentController } from "./interfaces/http/controllers/StudentController";
import { StudentRepository } from "./infrastructure/database/repositories/StudentRepository";
import { StudentUseCases } from "./application/use-cases/student/StudentUseCases";
import { AcademyController } from "./interfaces/http/controllers/AcademyController";
import { MongoAcademyRepository } from "./infrastructure/database/repositories/AcademyRepository";
import { AcademyUseCases } from "./application/use-cases/academy/AcademyUseCases";
import { GuardianController } from "./interfaces/http/controllers/GuardianController";
import { GuardianUseCases } from "./application/use-cases/guardian/GuardianUseCases";
import { StudentPortalController } from "./interfaces/http/controllers/StudentPortalController";
import { StudentPortalUseCases } from "./application/use-cases/student-portal/StudentPortalUseCases";
import { CoachPortalController } from "./interfaces/http/controllers/CoachPortalController";
import { CoachPortalUseCases } from "./application/use-cases/coach-portal/CoachPortalUseCases";
import { TeamController } from "./interfaces/http/controllers/TeamController";
import { TeamUseCases } from "./application/use-cases/team/TeamUseCases";
import { AdminAttendanceController } from "./interfaces/http/controllers/AdminAttendanceController";
import { AdminAttendanceUseCases } from "./application/use-cases/attendance/AdminAttendanceUseCases";
import { AdminFeesController } from "./interfaces/http/controllers/AdminFeesController";
import { AdminFeesUseCases } from "./application/use-cases/fees/AdminFeesUseCases";
import { AdminPerformanceController } from "./interfaces/http/controllers/AdminPerformanceController";
import { AdminPerformanceUseCases } from "./application/use-cases/performance/AdminPerformanceUseCases";
import { AdminNotificationController } from "./interfaces/http/controllers/AdminNotificationController";
import { AdminNotificationUseCases } from "./application/use-cases/notification/AdminNotificationUseCases";
import { ScheduleController } from "./interfaces/http/controllers/ScheduleController";
import { ScheduleUseCases } from "./application/use-cases/schedule/ScheduleUseCases";
import { SelectionController } from "./interfaces/http/controllers/SelectionController";
import { SelectionUseCases } from "./application/use-cases/selection/SelectionUseCases";
import { UsersController } from "./interfaces/http/controllers/UsersController";
import { UsersUseCases } from "./application/use-cases/users/UsersUseCases";
import { FinanceController } from "./interfaces/http/controllers/FinanceController";
import { FinanceUseCases } from "./application/use-cases/finance/FinanceUseCases";
import { DashboardController } from "./interfaces/http/controllers/DashboardController";
import { DashboardUseCases } from "./application/use-cases/dashboard/DashboardUseCases";
import { TransferUseCases } from "./application/use-cases/transfer/TransferUseCases";
import { FranchiseController } from "./interfaces/http/controllers/FranchiseController";
import { FranchiseUseCases } from "./application/use-cases/franchise/FranchiseUseCases";

const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time features
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.clientUrl,
    methods: ["GET", "POST"],
  },
});

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: [config.clientUrl, /^footballcamp:\/\//],
    credentials: true,
  }),
);
app.use(mongoSanitize());

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use(config.apiPrefix, limiter);

// ─── General Middleware ────────────────────────────────────────────────────────
app.use(compression());
app.use(morgan(config.env === "development" ? "dev" : "combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    env: config.env,
    version: "1.0.0",
  });
});

// ─── Dependency Injection ──────────────────────────────────────────────────────
// In production, use a proper DI container (e.g., tsyringe, inversify)
// This is a simplified manual DI bootstrap
async function bootstrapDI() {
  // Repositories
  const { MongoUserRepository } =
    await import("./infrastructure/database/repositories/UserRepository");
  const userRepository = new MongoUserRepository();
  const studentRepository = new StudentRepository();

  // Use Cases
  const authUseCases = new AuthUseCases(userRepository as any);
  const studentUseCases = new StudentUseCases(studentRepository, userRepository);

  // Controllers
  const authController = new AuthController(authUseCases);
  const transferUseCases = new TransferUseCases();
  const transferController = new TransferController(transferUseCases);

  const studentController = new StudentController(studentUseCases);

  const academyRepository = new MongoAcademyRepository();
const academyUseCases = new AcademyUseCases(academyRepository as any, userRepository as any);
const academyController = new AcademyController(academyUseCases);

  const guardianUseCases = new GuardianUseCases();
  const guardianController = new GuardianController(guardianUseCases);

  const studentPortalUseCases = new StudentPortalUseCases();
  const studentPortalController = new StudentPortalController(studentPortalUseCases);

  const coachPortalUseCases = new CoachPortalUseCases();
  const coachPortalController = new CoachPortalController(coachPortalUseCases);

  const teamUseCases = new TeamUseCases();
  const teamController = new TeamController(teamUseCases);

  const adminAttendanceUseCases = new AdminAttendanceUseCases();
  const attendanceController = new AdminAttendanceController(adminAttendanceUseCases);

  const adminFeesUseCases = new AdminFeesUseCases();
  const feesController = new AdminFeesController(adminFeesUseCases);

  const adminPerformanceUseCases = new AdminPerformanceUseCases();
  const performanceController = new AdminPerformanceController(adminPerformanceUseCases);

  const adminNotificationUseCases = new AdminNotificationUseCases();
  const notificationController = new AdminNotificationController(adminNotificationUseCases);

  const scheduleUseCases = new ScheduleUseCases();
  const scheduleController = new ScheduleController(scheduleUseCases);

  const selectionUseCases = new SelectionUseCases();
  const selectionController = new SelectionController(selectionUseCases);

  const usersUseCases = new UsersUseCases(userRepository);
  const usersController = new UsersController(usersUseCases);

  const financeUseCases = new FinanceUseCases();
  const financeController = new FinanceController(financeUseCases);

  const dashboardUseCases = new DashboardUseCases();
  const dashboardController = new DashboardController(dashboardUseCases);

  const franchiseUseCases = new FranchiseUseCases();
  const franchiseController = new FranchiseController(franchiseUseCases);

  app.locals.controllers = {
    auth: authController,
    transfer: transferController,
    student: studentController,
    academy: academyController,
    guardian: guardianController,
    studentPortal: studentPortalController,
    coachPortal: coachPortalController,
    team: teamController,
    attendance: attendanceController,
    fees: feesController,
    performance: performanceController,
    notification: notificationController,
    schedule: scheduleController,
    selection: selectionController,
    users: usersController,
    finance: financeController,
    dashboard: dashboardController,
    franchise: franchiseController,
  };
}

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use(config.apiPrefix, apiRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    timestamp: new Date().toISOString(),
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ─── Socket.IO Events ──────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on("join:franchise", (franchiseId: string) => {
    socket.join(`franchise:${franchiseId}`);
  });

  socket.on("join:user", (userId: string) => {
    socket.join(`user:${userId}`);
  });

  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Database & Server Startup ─────────────────────────────────────────────────
async function startServer() {
  try {
    await mongoose.connect(config.db.uri);
    logger.info("✅ MongoDB connected");

    await bootstrapDI();
    logger.info("✅ Dependency injection bootstrapped");

    httpServer.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} [${config.env}]`);
      logger.info(`📡 API available at ${config.apiPrefix}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;
