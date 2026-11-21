import { Router } from "express";
import { validate, id, body } from "../../validators/index.js";
import { respond } from "../../controllers/http.js";
import { reviewService } from "../../services/review/index.js";
import { protect, authorize } from "../../middleware/auth.js";

export function routes(dependencies) {
  const router = Router();
  const service = reviewService(dependencies);
  const authGuard = protect(dependencies);

  // Public: View course reviews
  router.get(
    "/course/:courseId",
    validate([id("courseId")]),
    respond((req) => service.getCourseReviews(req.params.courseId))
  );

  // Student / User / Admin: Add review
  router.post(
    "/:courseId",
    authGuard,
    authorize("student", "instructor", "admin"),
    validate([
      id("courseId"),
      body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
      body("comment").isString().trim().isLength({ min: 3, max: 500 }).withMessage("Comment must be 3-500 characters"),
    ]),
    respond((req) => service.addReview(req.user._id, req.user.role, req.params.courseId, req.body), 201)
  );

  // Student / Admin: Update review
  router.put(
    "/:id",
    authGuard,
    authorize("student", "admin"),
    validate([id()]),
    respond((req) => service.updateReview(req.params.id, req.user._id, req.user.role, req.body))
  );

  // Student / Admin: Delete review
  router.delete(
    "/:id",
    authGuard,
    authorize("student", "admin"),
    validate([id()]),
    respond((req) => service.deleteReview(req.params.id, req.user._id, req.user.role))
  );

  return router;
}
