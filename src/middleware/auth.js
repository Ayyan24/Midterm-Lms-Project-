import jwt from "jsonwebtoken";
import { User } from "../models/user/index.js";
import { AppError } from "../utils/errors.js";

export const protect = (dependencies) => async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError(401, "Not authorized; Bearer token required");
    }

    const decoded = jwt.verify(token, dependencies.config.jwtSecret);
    const user = await User.findById(decoded.sub || decoded.id);

    if (!user) {
      throw new AppError(401, "User belonging to token no longer exists");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(401, "Not authorized; invalid or expired token"));
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError(403, `Forbidden; role '${req.user?.role || "guest"}' is not authorized. Required: [${roles.join(", ")}]`));
  }
  next();
};
