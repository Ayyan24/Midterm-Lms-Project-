import mongoose from "mongoose";
const { Schema, model } = mongoose;

const user = new Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    bio: { type: String, maxlength: 500, default: "" },
    avatar: {
      url: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
      },
      public_id: { type: String, default: "" },
    },
    active: { type: Boolean, default: true },
    verified: { type: Boolean, default: true }, // Default true for flexible demo, can verify with OTP
    otpHash: { type: String, select: false },
    otpExpires: Date,
    otpAttempts: { type: Number, default: 0 },
    otpSent: Date,
  },
  { timestamps: true }
);

export const User = model("User", user);
