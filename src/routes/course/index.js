import { Router } from "express";
import { validate, id, courseRules, pageRules, body } from "../../validators/index.js";
import { respond } from "../../controllers/http.js";
import { courseService } from "../../services/course/index.js";
import { protect, authorize } from "../../middleware/auth.js";
import { upload } from "../../middleware/upload.js";

export function routes(dependencies) {
  const router = Router();
  const service = courseService(dependencies);
  const authGuard = protect(dependencies);

  // Public: List and search courses
  router.get(
    "/",
    validate(pageRules),
    respond((req) => service.listCourses(req.query))
  );

  // Public: Get single course
  router.get(
    "/:id",
    validate([id()]),
    respond((req) => service.getCourse(req.params.id))
  );

  // Instructor / Admin: Create course
  router.post(
    "/",
    authGuard,
    authorize("instructor", "admin"),
    upload.single("thumbnail"),
    validate(courseRules),
    respond((req) => service.createCourse(req.user._id, req.body, req.file), 201)
  );

  // Instructor / Admin: Update course
  router.put(
    "/:id",
    authGuard,
    authorize("instructor", "admin"),
    upload.single("thumbnail"),
    validate([id()]),
    respond((req) => service.updateCourse(req.params.id, req.user._id, req.user.role, req.body, req.file))
  );

  // Instructor / Admin: Delete course
  router.delete(
    "/:id",
    authGuard,
    authorize("instructor", "admin"),
    validate([id()]),
    respond((req) => service.deleteCourse(req.params.id, req.user._id, req.user.role))
  );

  // Instructor / Admin: Toggle publish
  router.patch(
    "/:id/publish",
    authGuard,
    authorize("instructor", "admin"),
    validate([id()]),
    respond((req) => service.togglePublish(req.params.id, req.user._id, req.user.role))
  );

  // Instructor / Admin: Add lecture
  router.post(
    "/:id/lectures",
    authGuard,
    authorize("instructor", "admin"),
    validate([id(), body("title").isString().trim().isLength({ min: 2, max: 100 })]),
    respond((req) => service.addLecture(req.params.id, req.user._id, req.user.role, req.body), 201)
  );

  return router;
}
