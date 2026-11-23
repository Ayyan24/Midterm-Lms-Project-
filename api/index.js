import { createApp } from "../src/app.js";
import { adapters } from "../src/config/adapter.js";
import { loadEnv } from "../src/config/env.js";
import mongoose from "mongoose";

const config = loadEnv();

let isConnected = false;
async function connectDB() {
  if (!isConnected && mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(config.mongoUri);
      isConnected = true;
    } catch (e) {
      console.error("Vercel DB connection error:", e.message);
    }
  }
}

const app = createApp({ config, ...adapters() });

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
