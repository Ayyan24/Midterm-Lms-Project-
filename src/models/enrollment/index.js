import mongoose from "mongoose";
const { Schema, model } = mongoose;

const enrollmentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedLectures: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = model("Enrollment", enrollmentSchema);
