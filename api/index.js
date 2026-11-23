import { createApp } from "../src/app.js";
import { adapters } from "../src/config/adapter.js";
import { loadEnv } from "../src/config/env.js";
import mongoose from "mongoose";

const config = loadEnv();

// Cached connection for Serverless environments (Vercel)
if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => console.log("MongoDB connected (Vercel Serverless)"))
    .catch((err) => console.error("MongoDB Atlas connection error:", err.message));
}

const app = createApp({ config, ...adapters() });

// Vercel natively accepts the Express app as default export
export default app;
