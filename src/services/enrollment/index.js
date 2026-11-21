import { Enrollment } from "../../models/enrollment/index.js";
import { Course } from "../../models/course/index.js";
import { assert } from "../../utils/errors.js";

export function enrollmentService() {
  return {
    async enroll(studentId, courseId) {
      const course = await Course.findById(courseId);
      assert(course, 404, "Course not found");
      assert(course.isPublished, 400, "Course is not published for enrollment");

      const existing = await Enrollment.findOne({ student: studentId, course: courseId });
      assert(!existing, 409, "You are already enrolled in this course");

      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
      });

      return { enrollment };
    },

    async getMyEnrollments(studentId) {
      const enrollments = await Enrollment.find({ student: studentId })
        .populate({
          path: "course",
          select: "title description thumbnail category level averageRating totalReviews instructor",
          populate: { path: "instructor", select: "name avatar" },
        })
        .sort("-enrolledAt");

      return {
        count: enrollments.length,
        enrollments,
      };
    },

    async getEnrollment(studentId, courseId) {
      const enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId,
      }).populate("course");
      assert(enrollment, 404, "You are not enrolled in this course");
      return { enrollment };
    },

    async updateProgress(studentId, courseId, lectureId, completed = true) {
      assert(lectureId, 400, "lectureId is required");

      const course = await Course.findById(courseId);
      assert(course, 404, "Course not found");

      const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
      assert(enrollment, 403, "You are not enrolled in this course");

      const lid = lectureId.toString();
      const alreadyDone = enrollment.completedLectures.some((id) => id.toString() === lid);

      if (completed && !alreadyDone) {
        enrollment.completedLectures.push(lectureId);
      } else if (!completed && alreadyDone) {
        enrollment.completedLectures = enrollment.completedLectures.filter(
          (id) => id.toString() !== lid
        );
      }

      const totalLectures = course.lectures?.length || 0;
      enrollment.progressPercentage =
        totalLectures > 0
          ? Math.round((enrollment.completedLectures.length / totalLectures) * 100)
          : 100;

      enrollment.status = enrollment.progressPercentage === 100 ? "completed" : "active";
      await enrollment.save();

      return {
        progressPercentage: enrollment.progressPercentage,
        status: enrollment.status,
        completedLectures: enrollment.completedLectures,
      };
    },

    async getInstructorStats(instructorId, userRole, courseId) {
      const course = await Course.findById(courseId);
      assert(course, 404, "Course not found");

      const isOwner = course.instructor.toString() === instructorId.toString();
      assert(isOwner || userRole === "admin", 403, "Not authorized to view analytics");

      const enrollments = await Enrollment.find({ course: courseId })
        .populate("student", "name email avatar")
        .sort("-enrolledAt");

      const total = enrollments.length;
      const completed = enrollments.filter((e) => e.status === "completed").length;
      const avg =
        total > 0
          ? Math.round(enrollments.reduce((acc, e) => acc + e.progressPercentage, 0) / total)
          : 0;

      return {
        totalStudents: total,
        completedStudents: completed,
        averageProgress: `${avg}%`,
        enrollments,
      };
    },
  };
}
