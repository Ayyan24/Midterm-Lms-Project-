export function loadEnv(env = process.env) {
  return {
    mongoUri:
      env.MONGO_URI ||
      "mongodb+srv://ayyanraghib4_db_user:Ayyan_Raghib24@cluster0.p9sxxna.mongodb.net/edulearn_lms?retryWrites=true&w=majority",
    jwtSecret:
      env.JWT_SECRET ||
      "7aff407b4f65a5e950c5d18ad15f06a2d00fce5f0813725a796bce021bd96052",
    otpSecret:
      env.OTP_SECRET ||
      "8b024290117069ff50d85ebe4d11d9156f66072cd35a189cab4d83de83d17483",
    port: Number(env.PORT || 5000),
    cloudinaryCloudName: env.CLOUDINARY_CLOUD_NAME || "fglmusnn",
    cloudinaryApiKey: env.CLOUDINARY_API_KEY || "784232635257225",
    cloudinaryApiSecret: env.CLOUDINARY_API_SECRET || "Rn1UcHy917-szFVIz4jF_Mtt2Hk",
    smtpHost: env.SMTP_HOST || "smtp.gmail.com",
    smtpPort: Number(env.SMTP_PORT || 587),
    smtpUser: env.SMTP_USER || "ayyanraghib4@gmail.com",
    smtpPass: env.SMTP_PASS || "hzvg ufmg hjyy rkty",
    mailFrom: env.MAIL_FROM || env.SMTP_USER || "ayyanraghib4@gmail.com",
  };
}
