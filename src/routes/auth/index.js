import { Router } from "express";
import { validate, credentials, body } from "../../validators/index.js";
import { respond } from "../../controllers/http.js";
import { authService } from "../../services/auth/index.js";
import { protect } from "../../middleware/auth.js";
import { upload } from "../../middleware/upload.js";
import { rateLimit } from "../../middleware/error.js";

export function routes(dependencies) {
  const router = Router();
  const authLimit = rateLimit();
  const account = authService(dependencies);
  const authGuard = protect(dependencies);

  // Signup / Register (support both conventions)
  router.post(
    "/signup",
    authLimit,
    upload.single("avatar"),
    validate([
      ...credentials,
      body("name").isString().trim().isLength({ min: 2, max: 80 }),
    ]),
    respond((req) => account.signup(req.body, req.file), 201)
  );

  router.post(
    "/register",
    authLimit,
    upload.single("avatar"),
    validate([
      ...credentials,
      body("name").isString().trim().isLength({ min: 2, max: 80 }),
    ]),
    respond((req) => account.signup(req.body, req.file), 201)
  );

  router.post(
    "/login",
    authLimit,
    validate(credentials),
    respond((req) => account.login(req.body))
  );

  // OTP Verification & Resend
  router.post(
    "/verify",
    authLimit,
    validate([
      body("email").isEmail().normalizeEmail(),
      body("code").matches(/^\d{6}$/),
    ]),
    respond((req) => account.verify(req.body))
  );

  router.post(
    "/resend",
    authLimit,
    validate([body("email").isEmail().normalizeEmail()]),
    respond((req) => account.resend(req.body))
  );

  router.post(
    "/send-otp",
    authLimit,
    validate([body("email").isEmail().normalizeEmail()]),
    respond((req) => account.sendOtp(req.body))
  );

  router.post(
    "/reset-password-otp",
    authLimit,
    validate([
      body("email").isEmail().normalizeEmail(),
      body("otp").matches(/^\d{6}$/),
      body("newPassword").isLength({ min: 6 }),
    ]),
    respond((req) => account.resetPasswordOtp(req.body))
  );

  // Protected User Profile
  router.get(
    "/me",
    authGuard,
    respond((req) => account.getMe(req.user._id))
  );

  router.put(
    "/update-profile",
    authGuard,
    upload.single("avatar"),
    respond((req) => account.updateProfile(req.user._id, req.body, req.file))
  );

  router.put(
    "/update-password",
    authGuard,
    respond((req) => account.updatePassword(req.user._id, req.body))
  );

  return router;
}
