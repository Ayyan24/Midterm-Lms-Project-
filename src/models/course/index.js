import mongoose from "mongoose";
const { Schema, model } = mongoose;

const lectureSchema = new Schema({
  title: { type: String, required: true, trim: true },
  durationMinutes: { type: Number, default: 10 },
  videoUrl: { type: String, default: "" },
  isPreview: { type: Boolean, default: false },
});

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 2000 },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      default: "Web Development",
      enum: [
        "Web Development",
        "Mobile Development",
        "Data Science",
        "Cloud & DevOps",
        "UI/UX Design",
        "Cybersecurity",
        "Business",
        "Other",
      ],
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "All Levels",
    },
    price: { type: Number, default: 0, min: 0 },
    thumbnail: {
      url: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
      },
      public_id: { type: String, default: "" },
    },
    lectures: [lectureSchema],
    isPublished: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courseSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "course",
  justOne: false,
});

export const Course = model("Course", courseSchema);
