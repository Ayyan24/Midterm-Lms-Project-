import { Course } from "../../models/course/index.js";
import { assert, AppError } from "../../utils/errors.js";

export function courseService({ media }) {
  return {
    async createCourse(instructorId, body, file) {
      const { title, description, category, level, price, isPublished, lectures } = body;
      assert(title && description, 400, "Title and description are required");

      let thumbnail = {
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
        public_id: "",
      };

      if (file && media) {
        thumbnail = await media.upload(file.buffer, "edulearn/thumbnails");
      }

      let parsedLectures = [];
      if (lectures) {
        try {
          parsedLectures = typeof lectures === "string" ? JSON.parse(lectures) : lectures;
        } catch {
          throw new AppError(400, "Invalid JSON format for lectures");
        }
      }

      const course = await Course.create({
        title,
        description,
        instructor: instructorId,
        category: category || "Web Development",
        level: level || "All Levels",
        price: price ? Number(price) : 0,
        isPublished: isPublished === true || isPublished === "true",
        thumbnail,
        lectures: parsedLectures,
      });

      return { course };
    },

    async listCourses(query = {}) {
      const { search, category, level, minPrice, maxPrice, sort, page = 1, limit = 10 } = query;
      const filter = { isPublished: true };

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }
      if (category) filter.category = category;
      if (level) filter.level = level;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }

      let sortBy = "-createdAt";
      if (sort === "price-asc") sortBy = "price";
      if (sort === "price-desc") sortBy = "-price";
      if (sort === "rating") sortBy = "-averageRating";

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const total = await Course.countDocuments(filter);
      const courses = await Course.find(filter)
        .populate("instructor", "name email avatar bio")
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum);

      return {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        count: courses.length,
        courses,
      };
    },

    async getCourse(id) {
      const course = await Course.findById(id)
        .populate("instructor", "name email avatar bio")
        .populate({
          path: "reviews",
          populate: { path: "student", select: "name avatar" },
        });
      assert(course, 404, "Course not found");
      return { course };
    },

    async updateCourse(courseId, userId, userRole, body, file) {
      const course = await Course.findById(courseId);
      assert(course, 404, "Course not found");

      const isOwner = course.instructor.toString() === userId.toString();
      assert(isOwner || userRole === "admin", 403, "Not authorized to update this course");

      const { title, description, category, level, price, isPublished, lectures } = body;
      if (title) course.title = title;
      if (description) course.description = description;
      if (category) course.category = category;
      if (level) course.level = level;
      if (price !== undefined) course.price = Number(price);
      if (isPublished !== undefined)
        course.isPublished = isPublished === true || isPublished === "true";

      if (lectures) {
        try {
          course.lectures = typeof lectures === "string" ? JSON.parse(lectures) : lectures;
        } catch {
          throw new AppError(400, "Invalid JSON format for lectures");
        }
      }

      if (file && media) {
        if (course.thumbnail?.public_id) {
          await media.delete(course.thumbnail.public_id);
        }
        course.thumbnail = await media.upload(file.buffer, "edulearn/thumbnails");
      }

      await course.save();
      return { course };
    },

    async deleteCourse(courseId, userId, userRole) {
      const course = await Course.findById(courseId);
      assert(course, 404, "Course not found");

      const isOwner = course.instructor.toString() === userId.toString();
      assert(isOwner || userRole === "admin", 403, "Not authorized to delete this course");

      if (course.thumbnail?.public_id && media) {
        await media.delete(course.thumbnail.public_id);
      }

      await course.deleteOne();
      return { message: "Course deleted successfully" };
    },

    async togglePublish(courseId, userId, userRole) {
      const course = await Course.findById(courseId);
      assert(course, 404, "Course not found");

      const isOwner = course.instructor.toString() === userId.toString();
      assert(isOwner || userRole === "admin", 403, "Not authorized to toggle publish status");

      course.isPublished = !course.isPublished;
      await course.save();

      return {
        isPublished: course.isPublished,
        message: `Course is now ${course.isPublished ? "Published" : "Unpublished"}`,
      };
    },

    async addLecture(courseId, userId, userRole, body) {
      const { title, durationMinutes, videoUrl, isPreview } = body;
      assert(title, 400, "Lecture title is required");

      const course = await Course.findById(courseId);
      assert(course, 404, "Course not found");

      const isOwner = course.instructor.toString() === userId.toString();
      assert(isOwner || userRole === "admin", 403, "Not authorized to modify this course");

      course.lectures.push({
        title,
        durationMinutes: durationMinutes ? Number(durationMinutes) : 10,
        videoUrl: videoUrl || "",
        isPreview: isPreview === true || isPreview === "true",
      });

      await course.save();
      return { course };
    },
  };
}
