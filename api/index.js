import { createApp } from "../src/app.js";
import { adapters } from "../src/config/adapter.js";
import { loadEnv } from "../src/config/env.js";
import mongoose from "mongoose";

const config = loadEnv();

let isConnected = false;

async function ensureDB() {
  if (!isConnected && mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
    } catch (err) {
      console.error("[Vercel DB Error]:", err.message);
    }
  }
}

const app = createApp({ config, ...adapters() });

export default async function handler(req, res) {
  try {
    if (!req.url || req.url === "/api" || req.url === "/api/" || req.url === "/api/index.js") {
      req.url = "/";
    } else if (req.url.startsWith("/api/index.js/")) {
      req.url = req.url.replace("/api/index.js", "");
    }
    await ensureDB();
    return new Promise((resolve, reject) => {
      res.on("finish", resolve);
      res.on("close", resolve);
      res.on("error", reject);
      app(req, res);
    });
  } catch (err) {
    console.error("[Vercel Handler Error]:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
    }
  }
}
