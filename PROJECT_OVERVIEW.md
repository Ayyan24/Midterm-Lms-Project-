# EduLearn LMS - Backend REST API
## Midterm Project Overview & Technical Specification

---

### Project Information
- **Project Title:** EduLearn Learning Management System (LMS) RESTful API
- **Track:** Backend Web Development
- **Course / Assessment:** Midterm Project Evaluation
- **Deadline:** November 20
- **Group Members:**
  1. *Member 1 Name (ID / Roll No)*
  2. *Member 2 Name (ID / Roll No)*
  3. *Member 3 Name (ID / Roll No)*

---

## 1. Executive Summary & Purpose

In modern digital education, educational institutions and online learning platforms require scalable, secure, and robust backend architectures to deliver courses, track student performance, and manage multimedia learning content.

**EduLearn LMS** is a production-grade backend API engineered to power an end-to-end e-learning platform. It provides strict **Role-Based Access Control (RBAC)** across three primary user tiers:
1. **Students:** Discover published courses, enroll in curriculum, track lecture progress percentage in real time, and leave authentic verified ratings.
2. **Instructors:** Create, update, and manage rich multimedia courses, upload visual thumbnails via Cloudinary, structure lecture syllabi, and inspect student enrollment metrics.
3. **Administrators:** Oversee platform integrity, moderate courses, manage users, and inspect platform analytics.

The project is built entirely on **Node.js, Express.js, MongoDB (Mongoose ODM)**, and integrates **Cloudinary** for scalable cloud media asset storage.

---

## 2. Project Scope

### Functional Scope
- **Authentication & Identity Management (Auth Module):**
  - Secure registration with role delegation (`student`, `instructor`, `admin`).
  - Credential authentication with one-way salted password hashing (`bcryptjs`).
  - Stateless JSON Web Token (`jsonwebtoken`) issue and validation.
  - Profile retrieval and update with avatar image upload to Cloudinary.
  - Password rotation with current password verification.
- **Course Management (Courses Module):**
  - Course creation with Cloudinary thumbnail upload and lecture syllabus definition.
  - Comprehensive catalog exploration featuring keyword search, category filtering, level filtering, price range, and sorting.
  - Detailed single-course view with instructor bio and populated reviews.
  - Ownership protection: only the instructor who created the course (or an admin) can update, delete, or toggle publish status.
- **Enrollment & Learning Tracking (Enrollments Module):**
  - One-click student enrollment in published courses (prevents duplicate enrollments).
  - Student learning dashboard: view all enrolled courses and current progress.
  - Granular lecture completion: mark lectures done/undone with automatic real-time recalculation of `progressPercentage` and course completion status (`active` -> `completed`).
  - Instructor dashboard: inspect enrollment counts, student progress distribution, and completion rates.
- **Reviews & Course Feedback (Reviews Module):**
  - Verified student reviews: only enrolled students can rate (1 to 5 stars) and comment on a course.
  - Real-time MongoDB aggregation hook: dynamically updates `averageRating` and `totalReviews` on the course upon any review creation or deletion.

### Non-Functional Scope
- **Security:** Strict authorization middleware, JWT expiration, password omission from response payloads, and role-based route guardrails.
- **Robust Error Handling:** Centralized error handling catching Mongoose CastErrors (bad ObjectIds), Duplicate Key errors (E11000), validation failures, and Multer file size boundaries.
- **Consistent Response Schema:** All endpoints respond with uniform `{ success: Boolean, message: String, data: Object }`.

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Runtime** | Node.js (v20+) | High-throughput asynchronous event-driven JavaScript runtime |
| **Framework** | Express.js (v4.21) | Minimalist, fast, and unopinionated web routing framework |
| **Database** | MongoDB & Mongoose (v8.9) | Document database optimal for hierarchical course and lecture data structures |
| **Authentication** | JWT (`jsonwebtoken`) & `bcryptjs` | Industry-standard stateless security with 10-round salted password hashing |
| **Media Storage** | Cloudinary SDK v2 & Multer | Direct in-memory buffer streaming for thumbnails and profile avatars |
| **Logging & Utility** | Morgan, Dotenv, CORS | Development HTTP request logging and cross-origin security |

---

## 4. Database Schema & Data Models

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│              User               │           │             Course              │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ _id: ObjectId                   │1        * │ _id: ObjectId                   │
│ name: String                    ├──────────►│ instructor: ObjectId (Ref User) │
│ email: String (unique)          │           │ title: String                   │
│ password: String (hashed)       │           │ description: String             │
│ role: 'student'|'instructor'    │           │ category: String                │
│ avatar: { url, public_id }      │           │ level: String                   │
│ bio: String                     │           │ price: Number                   │
└───────────────┬─────────────────┘           │ thumbnail: { url, public_id }   │
                │                             │ isPublished: Boolean            │
                │1                            │ lectures: [LectureSchema]       │
                │                             │ averageRating: Number           │
                │                             │ totalReviews: Number            │
                │                             └───────────────┬─────────────────┘
                │                                             │1
                │*                                            │*
┌───────────────▼─────────────────┐           ┌───────────────▼─────────────────┐
│           Enrollment            │           │             Review              │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ _id: ObjectId                   │           │ _id: ObjectId                   │
│ student: ObjectId (Ref User)    │           │ student: ObjectId (Ref User)    │
│ course: ObjectId (Ref Course)   │           │ course: ObjectId (Ref Course)   │
│ completedLectures: [ObjectId]   │           │ rating: Number (1 - 5)          │
│ progressPercentage: Number      │           │ comment: String                 │
│ status: 'active' | 'completed'  │           │ createdAt, updatedAt            │
└─────────────────────────────────┘           └─────────────────────────────────┘
```

---

## 5. API Route Matrix

### 🔐 Auth Module (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a student, instructor, or admin (with optional avatar) |
| `POST` | `/login` | Public | Authenticate user credentials and return signed JWT |
| `GET` | `/me` | Private | Retrieve authenticated user's profile |
| `PUT` | `/update-profile` | Private | Update name, bio, and upload avatar to Cloudinary |
| `PUT` | `/update-password` | Private | Change account password with current password verification |
| `POST` | `/send-otp` | Public | Send 6-digit OTP code to email via Gmail SMTP for password reset |
| `POST` | `/reset-password-otp` | Public | Verify OTP code and reset account password |

### 📚 Courses Module (`/api/v1/courses`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | Explore courses with search, filters (`category`, `level`), price sort, pagination |
| `GET` | `/:id` | Public | Get course details with instructor bio and populated reviews |
| `POST` | `/` | Instructor, Admin | Create course with Cloudinary thumbnail & syllabus |
| `PUT` | `/:id` | Instructor, Admin | Update course metadata, lectures, or thumbnail |
| `DELETE` | `/:id` | Instructor, Admin | Delete course & delete thumbnail from Cloudinary |
| `PATCH` | `/:id/publish` | Instructor, Admin | Toggle course published / unpublished status |
| `POST` | `/:id/lectures` | Instructor, Admin | Append a new lecture to course syllabus |

### 🎓 Enrollments Module (`/api/v1/enrollments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/:courseId` | Student, Admin | Enroll in a published course |
| `GET` | `/my` | Student, Admin | Get all courses enrolled by the authenticated student |
| `GET` | `/course/:courseId` | Student, Admin | View single course enrollment progress details |
| `PATCH`| `/:courseId/progress`| Student, Admin | Mark a lecture complete/incomplete & recalculate progress % |
| `GET` | `/instructor/:courseId` | Instructor, Admin | View course enrollment statistics & student progress |

### ⭐ Reviews Module (`/api/v1/reviews`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/course/:courseId` | Public | Get all reviews for a specific course |
| `POST` | `/:courseId` | Student, Admin | Submit verified student rating (1-5) and feedback |
| `PUT` | `/:id` | Student (Owner), Admin | Update existing review and recalculate course average |
| `DELETE` | `/:id` | Student (Owner), Admin | Delete review and recalculate course average |

---

## 6. How to Run the Project Locally

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or a free cloud MongoDB Atlas cluster URL)

### 2. Installation
```bash
# Clone or navigate to the project directory
cd "mid term project"

# Install all dependencies
npm install
```

### 3. Environment Configuration
Check `.env` in the root folder and configure:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/edulearn_lms
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Start Server
```bash
# Start in development mode with nodemon
npm run dev

# Or start in standard mode
npm start
```
Server starts on `http://localhost:5000`.

---

## 7. Midterm Presentation & Postman Demo Guide

When presenting to your instructor, use the provided `EduLearn_LMS_Postman_Collection.json`.

### Step-by-Step 4-Minute Presentation Walkthrough:
1. **Import the Collection:**
   - In Postman, click **Import** and select `EduLearn_LMS_Postman_Collection.json`.
   - The collection variable `{{baseUrl}}` is already set to `http://localhost:5000/api/v1`.
2. **Demonstrate Auth Module (`1. Auth Module`):**
   - Run **`1. Signup (Register User)`** ➔ Generates salted password hash and sends 6-digit OTP email.
   - Run **`2. Verify OTP`** ➔ Shows verification logic and HMAC-SHA256 comparison.
   - Run **`3. Login`** ➔ Returns `200 OK` and automatically saves the JWT token into `{{token}}`.
   - Run **`4. Get Profile (Me)`** ➔ Proves Bearer token middleware authentication works.
3. **Demonstrate Courses Module (`2. Courses Module`):**
   - Run **`5. Create Course`** ➔ Course is created with syllabus and Cloudinary thumbnail. The `courseId` is automatically saved!
   - Run **`6. Get All Courses (Catalog)`** ➔ Shows public catalog with pagination, search, and category filters.
4. **Demonstrate Enrollments Module (`3. Enrollments Module`):**
   - Run **`7. Enroll in Course`** ➔ Enrolls the user into the course.
   - Run **`8. My Enrolled Courses & Progress`** ➔ Shows enrolled courses dashboard and lecture progress.
5. **Demonstrate Reviews Module (`4. Reviews Module`):**
   - Run **`9. Add Course Review`** ➔ Submits a 5-star rating and shows automatic Mongoose rollup recalculation of `averageRating`.
