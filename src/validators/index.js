import { body, param, query, validationResult } from "express-validator";
import { AppError } from "../utils/errors.js";

export const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const msgs = result.array().map((err) => `${err.path}: ${err.msg}`).join(", ");
      throw new AppError(422, `Invalid input; check fields: ${msgs}`);
    }
    next();
  },
];

export const id = (name = "id") => param(name).isMongoId().withMessage(`Invalid ${name} parameter`);

export const credentials = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isString()
    .isLength({ min: 6, max: 72 })
    .withMessage("Password must be between 6 and 72 characters"),
];

export const courseRules = [
  body("title").isString().trim().isLength({ min: 5, max: 100 }).withMessage("Course title must be 5-100 characters"),
  body("description").isString().trim().isLength({ min: 10, max: 2000 }).withMessage("Description must be 10-2000 characters"),
  body("category").optional().isString().trim(),
  body("level").optional().isIn(["Beginner", "Intermediate", "Advanced", "All Levels"]).withMessage("Invalid course level"),
  body("price").optional().isFloat({ min: 0 }).toFloat().withMessage("Price must be 0 or greater"),
];

export const pageRules = [
  query("page").optional().isInt({ min: 1, max: 1000 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("search").optional().isString().isLength({ max: 100 }),
  query("category").optional().isString(),
  query("level").optional().isIn(["Beginner", "Intermediate", "Advanced", "All Levels"]),
  query("sort").optional().isIn(["newest", "price-asc", "price-desc", "rating"]),
];

export { body, param, query };
