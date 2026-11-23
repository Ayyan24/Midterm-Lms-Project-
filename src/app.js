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
  app.get(["/", "/api", "/api/v1"], (req, res) => {
    if (req.accepts("html") && !req.xhr && !req.headers["postman-token"]) {
      return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduLearn LMS - Backend REST API</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 36px; max-width: 600px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
    .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; }
    h1 { font-size: 26px; margin: 0 0 10px; color: #fff; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px; }
    .item { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; }
    .lbl { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .val { font-size: 13px; color: #e2e8f0; font-weight: 600; margin-top: 4px; }
    .btns { display: flex; flex-wrap: wrap; gap: 10px; }
    .btn { display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; }
    .btn:hover { background: #4338ca; }
    .btn-sec { background: #334155; }
    .btn-sec:hover { background: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> API Deployed &amp; Running Live</div>
    <h1>EduLearn LMS Backend API</h1>
    <p>Production RESTful API powered by <strong>Node.js, Express, MongoDB Atlas, and Cloudinary</strong>.</p>
    <div class="grid">
      <div class="item"><div class="lbl">Status</div><div class="val" style="color:#4ade80;">Online 200 OK</div></div>
      <div class="item"><div class="lbl">Database</div><div class="val" style="color:#4ade80;">MongoDB Atlas Connected</div></div>
      <div class="item"><div class="lbl">Auth Engine</div><div class="val">JWT + Gmail OTP</div></div>
      <div class="item"><div class="lbl">Architecture</div><div class="val">BE_BanoQabil/be</div></div>
    </div>
    <div class="btns">
      <a href="/api/v1/health" class="btn" target="_blank">Health Check API</a>
      <a href="/api/v1/courses" class="btn btn-sec" target="_blank">Browse Courses</a>
      <a href="https://github.com/Ayyan24/Midterm-Lms-Project-" class="btn btn-sec" target="_blank">GitHub Repo</a>
    </div>
  </div>
</body>
</html>`);
    }
    return res.json({
      success: true,
      message: "EduLearn LMS REST API is running live!",
      version: "1.0.0",
      health: "/health",
    });
  });

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
