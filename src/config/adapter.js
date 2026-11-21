import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "stream";

export function adapters(env = process.env) {
  // 1. Email (SMTP) Adapter
  const smtp = nodemailer.createTransport({
    host: env.SMTP_HOST || "smtp.gmail.com",
    port: Number(env.SMTP_PORT || 587),
    secure: env.SMTP_PORT === "465",
    ...(env.SMTP_USER
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
      : {}),
  });

  // 2. Cloudinary Media Adapter
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }

  const uploadMedia = (buffer, folder = "edulearn") => {
    return new Promise((resolve, reject) => {
      if (
        !env.CLOUDINARY_CLOUD_NAME ||
        env.CLOUDINARY_CLOUD_NAME === "your_cloud_name" ||
        env.CLOUDINARY_CLOUD_NAME === "demo"
      ) {
        const randomId = Math.random().toString(36).substring(2, 10);
        return resolve({
          url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
          public_id: `${folder}/mock_${randomId}`,
        });
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto" },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      const readable = new streamifier.Readable();
      readable._read = () => {};
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  };

  const deleteMedia = async (publicId) => {
    try {
      if (!publicId || publicId.includes("mock_")) return;
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error(`[Cloudinary Destroy Error]: ${err.message}`);
    }
  };

  return {
    email: {
      send: (to, code) =>
        smtp.sendMail({
          from: env.MAIL_FROM || env.SMTP_USER,
          to,
          subject: "Verify your EduLearn account",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #4F46E5;">EduLearn Verification Code</h2>
              <p>Your verification OTP code is:</p>
              <div style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; margin: 20px 0;">
                ${code}
              </div>
              <p style="color: #666; font-size: 13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
            </div>
          `,
          text: `Your EduLearn verification code is: ${code}. It expires in ten minutes.`,
        }),
    },
    media: {
      upload: uploadMedia,
      delete: deleteMedia,
    },
  };
}
