import express from "express";
import cors from "cors";
import { routes as authRoutes } from "./routes/auth/index.js";
import { routes as courseRoutes } from "./routes/course/index.js";
import { routes as enrollmentRoutes } from "./routes/enrollment/index.js";
import { routes as reviewRoutes } from "./routes/review/index.js";
import { errors, rateLimit } from "./middleware/error.js";

export function createApp(dependencies) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(rateLimit({ max: 300 }));
  app.use(express.json({ limit: "64kb" }));
  app.use(express.urlencoded({ extended: true }));

  // Root & Health routes
  app.get(["/", "/api", "/api/v1"], (req, res) =>
    res.json({
      success: true,
      message: "EduLearn LMS REST API is running live!",
      version: "1.0.0",
      health: "/health",
    })
  );

  app.get("/health", (req, res) =>
    res.json({ success: true, status: "OK", uptime: process.uptime() })
  );
  app.get("/api/v1/health", (req, res) =>
    res.json({ success: true, status: "OK", uptime: process.uptime() })
  );

  // Domain Routes (supporting both /api and /api/v1 for maximum compatibility)
  app.use("/api/auth", authRoutes(dependencies));
  app.use("/api/v1/auth", authRoutes(dependencies));

  app.use("/api/courses", courseRoutes(dependencies));
  app.use("/api/v1/courses", courseRoutes(dependencies));

  app.use("/api/enrollments", enrollmentRoutes(dependencies));
  app.use("/api/v1/enrollments", enrollmentRoutes(dependencies));

  app.use("/api/reviews", reviewRoutes(dependencies));
  app.use("/api/v1/reviews", reviewRoutes(dependencies));

  // 404 catch-all
  app.use((req, res) => res.status(404).json({ success: false, error: "Route not found" }));

  // Global centralized error handler
  app.use(errors);

  return app;
}
