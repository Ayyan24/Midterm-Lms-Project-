import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../models/user/index.js";
import { assert, publicUser, AppError } from "../../utils/errors.js";
import { makeOtp, hashOtp } from "../../utils/otp.js";

export function authService({ config, email, media, clock = () => new Date() }) {
  const token = (user) =>
    jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
      expiresIn: "30d",
    });

  return {
    async signup({ name, email: address, password, role = "student", bio = "" }, file) {
      const existing = await User.findOne({ email: address });
      assert(!existing, 409, "An account with this email already exists");

      const code = makeOtp();
      const now = clock();

      let avatar = {
        url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
        public_id: "",
      };

      if (file && media) {
        avatar = await media.upload(file.buffer, "edulearn/avatars");
      }

      const user = await User.create({
        name,
        email: address,
        password: await bcrypt.hash(password, 12),
        role,
        bio,
        avatar,
        verified: true, // set true for seamless local testing, email still sent
        otpHash: hashOtp(address, code, config.otpSecret),
        otpExpires: new Date(+now + 600000),
        otpSent: now,
      });

      if (email && email.send) {
        try {
          await email.send(address, code);
        } catch (err) {
          console.warn("[Email Notice] Could not send initial signup email:", err.message);
        }
      }

      return {
        user: publicUser(user),
        token: token(user),
      };
    },

    async resend({ email: address }) {
      const now = clock();
      const code = makeOtp();
      const user = await User.findOneAndUpdate(
        {
          email: address,
          active: true,
        },
        {
          $set: {
            otpHash: hashOtp(address, code, config.otpSecret),
            otpExpires: new Date(+now + 600000),
            otpSent: now,
            otpAttempts: 0,
          },
        },
        { new: true }
      );
      assert(user, 404, "User account not found or inactive");
      await email.send(address, code);
      return { message: "Verification OTP code sent to your email" };
    },

    async verify({ email: address, code }) {
      const now = clock();
      const user = await User.findOneAndUpdate(
        {
          email: address,
          active: true,
          otpExpires: { $gt: now },
          otpAttempts: { $lt: 5 },
          otpHash: hashOtp(address, code, config.otpSecret),
        },
        { $set: { verified: true }, $unset: { otpHash: 1, otpExpires: 1 } },
        { new: true }
      );

      if (!user) {
        await User.updateOne(
          {
            email: address,
            otpExpires: { $gt: now },
            otpAttempts: { $lt: 5 },
          },
          { $inc: { otpAttempts: 1 } }
        );
        assert(false, 400, "Invalid, expired, or already used OTP code");
      }

      return {
        message: "Email verified successfully",
        user: publicUser(user),
        token: token(user),
      };
    },

    async login({ email: address, password }) {
      const user = await User.findOne({ email: address }).select("+password");
      assert(
        user && (await bcrypt.compare(password, user.password)),
        401,
        "Invalid email or password"
      );
      assert(user.active, 403, "Account is disabled. Contact support.");

      return {
        user: publicUser(user),
        token: token(user),
      };
    },

    async sendOtp({ email: address }) {
      return this.resend({ email: address });
    },

    async resetPasswordOtp({ email: address, otp, newPassword }) {
      assert(newPassword && newPassword.length >= 6, 400, "New password must be at least 6 characters");
      const verifiedResult = await this.verify({ email: address, code: otp });

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await User.findByIdAndUpdate(verifiedResult.user.id, { password: hashedPassword });

      return {
        message: "Password reset successfully. You are now logged in.",
        user: verifiedResult.user,
        token: verifiedResult.token,
      };
    },

    async getMe(userId) {
      const user = await User.findById(userId);
      assert(user, 404, "User not found");
      return { user: publicUser(user) };
    },

    async updateProfile(userId, { name, bio }, file) {
      const user = await User.findById(userId);
      assert(user, 404, "User not found");

      if (name) user.name = name;
      if (bio !== undefined) user.bio = bio;

      if (file && media) {
        if (user.avatar?.public_id) {
          await media.delete(user.avatar.public_id);
        }
        user.avatar = await media.upload(file.buffer, "edulearn/avatars");
      }

      await user.save();
      return { user: publicUser(user) };
    },

    async updatePassword(userId, { currentPassword, newPassword }) {
      assert(currentPassword && newPassword, 400, "Provide both current and new passwords");
      assert(newPassword.length >= 6, 400, "New password must be at least 6 characters");

      const user = await User.findById(userId).select("+password");
      assert(user, 404, "User not found");

      const match = await bcrypt.compare(currentPassword, user.password);
      assert(match, 400, "Current password does not match");

      user.password = await bcrypt.hash(newPassword, 12);
      await user.save();

      return {
        message: "Password updated successfully",
        token: token(user),
      };
    },
  };
}
