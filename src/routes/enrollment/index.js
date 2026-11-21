import { Router } from "express";
import { validate, id, body } from "../../validators/index.js";
import { respond } from "../../controllers/http.js";
import { enrollmentService } from "../../services/enrollment/index.js";
import { protect, authorize } from "../../middleware/auth.js";

export function routes(dependencies) {
  const router = Router();
  const service = enrollmentService(dependencies);
  const authGuard = protect(dependencies);

  // Student / User: View own enrollments
  router.get(
    "/my",
    authGuard,
    authorize("student", "instructor", "admin"),
    respond((req) => service.getMyEnrollments(req.user._id))
  );

  // Student / User: View single enrollment
  router.get(
    "/course/:courseId",
    authGuard,
    validate([id("courseId")]),
    respond((req) => service.getEnrollment(req.user._id, req.params.courseId))
  );

  // Student / User: Enroll in course
  router.post(
    "/:courseId",
    authGuard,
    authorize("student", "instructor", "admin"),
    validate([id("courseId")]),
    respond((req) => service.enroll(req.user._id, req.params.courseId), 201)
  );

  // Student / User: Update lecture progress
  router.patch(
    "/:courseId/progress",
    authGuard,
    authorize("student", "instructor", "admin"),
    validate([id("courseId"), body("lectureId").isMongoId()]),
    respond((req) =>
      service.updateProgress(
        req.user._id,
        req.params.courseId,
        req.body.lectureId,
        req.body.completed
      )
    )
  );

  // Instructor / Admin: Course analytics
  router.get(
    "/instructor/:courseId",
    authGuard,
    authorize("instructor", "admin"),
    validate([id("courseId")]),
    respond((req) => service.getInstructorStats(req.user._id, req.user.role, req.params.courseId))
  );

  return router;
}
