export function loadEnv(env = process.env) {
  for (const key of ["MONGO_URI", "JWT_SECRET", "OTP_SECRET"]) {
    if (!env[key] || (key !== "MONGO_URI" && env[key].length < 32))
      throw new Error(`Configure ${key} in .env`);
  }
  return {
    mongoUri: env.MONGO_URI,
    jwtSecret: env.JWT_SECRET,
    otpSecret: env.OTP_SECRET,
    port: Number(env.PORT || 5000),
    cloudinaryCloudName: env.CLOUDINARY_CLOUD_NAME || "",
    cloudinaryApiKey: env.CLOUDINARY_API_KEY || "",
    cloudinaryApiSecret: env.CLOUDINARY_API_SECRET || "",
    smtpHost: env.SMTP_HOST || "smtp.gmail.com",
    smtpPort: Number(env.SMTP_PORT || 587),
    smtpUser: env.SMTP_USER || "",
    smtpPass: env.SMTP_PASS || "",
    mailFrom: env.MAIL_FROM || env.SMTP_USER || "EduLearn Support <noreply@edulearn.com>",
  };
}
