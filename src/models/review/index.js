import mongoose from "mongoose";
const { Schema, model } = mongoose;

const reviewSchema = new Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ student: 1, course: 1 }, { unique: true });

reviewSchema.statics.calculateAverageRating = async function (courseId) {
  const stats = await this.aggregate([
    { $match: { course: courseId } },
    {
      $group: {
        _id: "$course",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const Course = mongoose.model("Course");
  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
};

reviewSchema.post("save", async function () {
  await this.constructor.calculateAverageRating(this.course);
});

reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.course);
  }
});

export const Review = model("Review", reviewSchema);
