import { Review } from "../../models/review/index.js";
import { Course } from "../../models/course/index.js";
import { Enrollment } from "../../models/enrollment/index.js";
import { assert } from "../../utils/errors.js";

export function reviewService() {
  return {
    async addReview(studentId, userRole, courseId, { rating, comment }) {
      assert(rating && comment, 400, "Please provide rating and comment");

      const course = await Course.findById(courseId);
      assert(course, 404, "Course not found");

      if (userRole === "student") {
        const isEnrolled = await Enrollment.findOne({ student: studentId, course: courseId });
        assert(isEnrolled, 403, "You must be enrolled in this course to leave a review");
      }

      const existing = await Review.findOne({ student: studentId, course: courseId });
      assert(!existing, 409, "You have already reviewed this course. You can update your existing review.");

      const review = await Review.create({
        student: studentId,
        course: courseId,
        rating: Number(rating),
        comment,
      });

      return { review };
    },

    async getCourseReviews(courseId) {
      const reviews = await Review.find({ course: courseId })
        .populate("student", "name avatar")
        .sort("-createdAt");

      return {
        count: reviews.length,
        reviews,
      };
    },

    async updateReview(reviewId, userId, userRole, { rating, comment }) {
      const review = await Review.findById(reviewId);
      assert(review, 404, "Review not found");

      const isOwner = review.student.toString() === userId.toString();
      assert(isOwner || userRole === "admin", 403, "Not authorized to update this review");

      if (rating) review.rating = Number(rating);
      if (comment) review.comment = comment;

      await review.save();
      return { review };
    },

    async deleteReview(reviewId, userId, userRole) {
      const review = await Review.findById(reviewId);
      assert(review, 404, "Review not found");

      const isOwner = review.student.toString() === userId.toString();
      assert(isOwner || userRole === "admin", 403, "Not authorized to delete this review");

      await Review.findOneAndDelete({ _id: reviewId });
      return { message: "Review deleted successfully" };
    },
  };
}
