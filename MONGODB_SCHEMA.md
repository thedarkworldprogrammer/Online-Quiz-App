# Comprehensive MongoDB Schema Design for EduAssess AI

This document provides a comprehensive blueprint of the MongoDB schema and Mongoose models implemented for **EduAssess AI**. All schemas are fully written in TypeScript, optimized for high performance, typed using raw interfaces, and include comprehensive indexes and referential integrity mechanisms.

---

## 🏗️ Architectural Overview

We utilize **Mongoose** (MongoDB Object Document Mapper) for database modeling. For local development or quick deployment previews, the application uses a lightweight file-based store (`src/server/db.ts`), but has been augmented with full production-ready Mongoose models under `src/server/models` for MongoDB integration.

### Key Performance & Scalability Measures
1. **Index Optimization**: Single-field and compound indexes are established for rapid query execution (e.g., matching a student to a course, listing published quizzes, querying logs by timestamp).
2. **Referential Integrity**: Relationships are mapped clearly via descriptive ID strings (e.g., `courseId`, `studentId`, `quizId`) with compound index constraints (such as `{ unique: true }` on duplicate attendance or submissions).
3. **Optimized Serialization**: Overridden `.toJSON` properties automatically transform `_id` into client-friendly `id` fields and exclude internal mongoose metadata fields like `__v`.

---

## 📊 Entity Schemas & Mongoose Models

Here is a detailed breakdown of the MongoDB schema structures:

### 1. User Model (`User`)
Represents members of the institution (Admins, Teachers, Students).

*   **File Location**: `src/server/models/User.ts`
*   **Database Collection**: `users`
*   **Properties**:
    *   `id`: `String` (Unique, Indexed) – Human-readable identifier (e.g., `usr-student-1`).
    *   `name`: `String` (Required, Trimmed) – Full name of the user.
    *   `email`: `String` (Required, Unique, Lowercased, Trimmed) – Login email.
    *   `role`: `String` (Required, Enum: `['admin', 'teacher', 'student']`) – System role.
    *   `avatar`: `String` – Profile image URL.
    *   `status`: `String` (Enum: `['active', 'suspended']`, Default: `active`) – Account status.
    *   `academicDetails`: `Sub-document` (Optional, for students)
        *   `batch`: `String` (Trimmed) – Batch reference (e.g., `A`).
        *   `semester`: `String` (Trimmed) – Academic semester (e.g., `4th Semester`).
        *   `rollNo`: `String` (Trimmed) – Student roll number.
        *   `xp`: `Number` (Default: `0`) – Gamified experience points.
        *   `level`: `Number` (Default: `1`) – Current gamified level.
        *   `streak`: `Number` (Default: `0`) – Consecutive learning streak days.
*   **Indexes**:
    *   `{ id: 1 }` (Unique)
    *   `{ email: 1 }` (Unique, case-insensitive via lowercase mapping)
    *   `{ role: 1, status: 1 }` (Compound index for fetching active students/teachers)

---

### 2. Course Model (`Course`)
Coordinates college degree curricula, subject groupings, and batch codes.

*   **File Location**: `src/server/models/Course.ts`
*   **Database Collection**: `courses`
*   **Properties**:
    *   `id`: `String` (Unique, Indexed) – Custom Course ID (e.g., `crs-1`).
    *   `name`: `String` (Required, Trimmed) – Official course title.
    *   `code`: `String` (Required, Unique, Trimmed) – Curricular ID (e.g., `CSE-2026`).
    *   `semester`: `String` (Required, Trimmed) – Target semester.
    *   `batch`: `String` (Required, Trimmed) – Target batch.
    *   `session`: `String` (Required, Trimmed) – Academic year.
    *   `subjects`: `[String]` – List of courses/topics of study.
*   **Indexes**:
    *   `{ id: 1 }` (Unique)
    *   `{ code: 1 }` (Unique)
    *   `{ batch: 1, semester: 1 }` (Compound index for batch coordinators)

---

### 3. Quiz Model (`Quiz`)
Handles real-time proctored online examinations.

*   **File Location**: `src/server/models/Quiz.ts`
*   **Database Collection**: `quizzes`
*   **Properties**:
    *   `id`: `String` (Unique, Indexed)
    *   `title`: `String` (Required, Trimmed)
    *   `courseId`: `String` (Required, Indexed) – Reference to the parent Course.
    *   `subject`: `String` (Required, Trimmed)
    *   `duration`: `Number` (Required, Default: `30` min)
    *   `negativeMarking`: `Boolean` (Default: `false`)
    *   `passPercentage`: `Number` (Default: `40`)
    *   `maxAttempts`: `Number` (Default: `1`)
    *   `isPublished`: `Boolean` (Default: `false`, Indexed)
    *   `scheduledAt`: `String` – Date and time of start.
    *   `questions`: `[QuestionSchema]` – Embedded sub-documents.
        *   `id`: `String` (Required)
        *   `type`: `String` (Enum: `['mcq', 'subjective', 'coding']`)
        *   `text`: `String` (Required)
        *   `options`: `[String]` (For MCQs)
        *   `correctAnswer`: `String` (Zero-indexed string of MCQ correct option)
        *   `points`: `Number` (Default: `1`)
        *   `difficulty`: `String` (Enum: `['easy', 'medium', 'hard']`)
        *   `codingTemplate`: `String` (Preloaded starter code)
        *   `testCases`: `Array` – Embedded test cases for automated compile scoring.
            *   `input`: `String`
            *   `output`: `String`
*   **Indexes**:
    *   `{ id: 1 }` (Unique)
    *   `{ courseId: 1, isPublished: 1 }` (Compound index for fetching published exams for students)
    *   `{ subject: 1 }` (Index for subject filters)

---

### 4. QuizAttempt Model (`QuizAttempt`)
Tracks proctored exam answers, auto-calculated performance score, and anti-cheat telemetry data.

*   **File Location**: `src/server/models/QuizAttempt.ts`
*   **Database Collection**: `quizattempts`
*   **Properties**:
    *   `id`: `String` (Unique, Indexed)
    *   `quizId`: `String` (Required, Indexed)
    *   `studentId`: `String` (Required, Indexed)
    *   `score`: `Number` (Required, Default: `0`)
    *   `totalPoints`: `Number` (Required, Default: `0`)
    *   `answers`: `Map of Strings` – Key-value pairs matching `questionId` to student response text.
    *   `startedAt`: `String` (Required)
    *   `completedAt`: `String` (Required)
    *   `tabSwitches`: `Number` (Default: `0`) – Critical Proctoring Telemetry.
    *   `isFullScreenViolation`: `Boolean` (Default: `false`) – Critical Proctoring Telemetry.
    *   `autoSubmitted`: `Boolean` (Default: `false`) – Submission due to timer exhaustion.
*   **Indexes**:
    *   `{ id: 1 }` (Unique)
    *   `{ studentId: 1, quizId: 1 }` (Compound index for lightning-fast verification of previous attempts)

---

### 5. Assignment Model (`Assignment`)
Course projects/homework entries demanding PDF or code submission.

*   **File Location**: `src/server/models/Assignment.ts`
*   **Database Collection**: `assignments`
*   **Properties**:
    *   `id`: `String` (Unique, Indexed)
    *   `title`: `String` (Required, Trimmed)
    *   `description`: `String` (Trimmed)
    *   `courseId`: `String` (Required, Indexed)
    *   `subject`: `String` (Required, Trimmed, Indexed)
    *   `deadline`: `String` (Required)
    *   `points`: `Number` (Required, Default: `100`)
    *   `allowLate`: `Boolean` (Default: `false`)
    *   `fileUrl`: `String` (Instructions or worksheet attachment URL)
*   **Indexes**:
    *   `{ id: 1 }` (Unique)
    *   `{ courseId: 1, deadline: 1 }` (Compound index for student calendars and pending assignments)

---

### 6. Submission Model (`Submission`)
Student-submitted homework files along with grade details and Gemini AI grading feedbacks.

*   **File Location**: `src/server/models/Submission.ts`
*   **Database Collection**: `submissions`
*   **Properties**:
    *   `id`: `String` (Unique, Indexed)
    *   `assignmentId`: `String` (Required, Indexed)
    *   `studentId`: `String` (Required, Indexed)
    *   `fileUrl`: `String` (Required) – Uploaded PDF/ZIP file path.
    *   `fileName`: `String` (Required) – Display file name.
    *   `submittedAt`: `String` (Required)
    *   `grade`: `Number` (Optional) – Evaluated score.
    *   `feedback`: `String` (Optional) – Manual professor feedback.
    *   `plagiarismScore`: `Number` (Optional) – Plagiarism detection rate.
    *   `aiAssistedFeedback`: `String` (Optional) – AI generated grading notes.
*   **Indexes**:
    *   `{ id: 1 }` (Unique)
    *   `{ studentId: 1, assignmentId: 1 }` (Compound Unique Index: Restricts each student to exactly one submission per assignment)

---

### 7. Message Model (`Message`)
In-app communication records between students, teachers, and admins.

*   **File Location**: `src/server/models/Message.ts`
*   **Database Collection**: `messages`
*   **Properties**:
    *   `id`: `String` (Unique, Indexed)
    *   `senderId`: `String` (Required, Indexed)
    *   `senderName`: `String` (Required)
    *   `senderRole`: `String` (Required)
    *   `receiverId`: `String` (Required, Indexed)
    *   `receiverName`: `String` (Required)
    *   `content`: `String` (Required, Trimmed)
    *   `timestamp`: `String` (Required)
    *   `isRead`: `Boolean` (Default: `false`, Indexed)
*   **Indexes**:
    *   `{ id: 1 }` (Unique)
    *   `{ senderId: 1, receiverId: 1, timestamp: -1 }` (Compound Index for ordering conversation histories)
    *   `{ receiverId: 1, isRead: 1 }` (Compound Index for listing unread message counts in navigation headers)

---

### 8. Notification Model (`Notification`)
Personal alerts for grades, messages, quiz publications, or system events.

*   **File Location**: `src/server/models/Notification.ts`
*   **Database Collection**: `notifications`
*   **Properties**:
    *   `id`: `String` (Unique, Indexed)
    *   `userId`: `String` (Required, Indexed)
    *   `title`: `String` (Required)
    *   `message`: `String` (Required)
    *   `type`: `String` (Enum: `['quiz', 'assignment', 'grade', 'message', 'system']`, Required)
    *   `isRead`: `Boolean` (Default: `false`, Indexed)
    *   `createdAt`: `String` (Required)
*   **Indexes**:
    *   `{ id: 1 }` (Unique)
    *   `{ userId: 1, isRead: 1, createdAt: -1 }` (Compound Index for fetching unread alerts sorted by newest first)

---

### 9. Attendance Model (`Attendance`)
Class attendance registries tracking daily student attendance.

*   **File Location**: `src/server/models/Attendance.ts`
*   **Database Collection**: `attendances`
*   **Properties**:
    *   `id`: `String` (Unique, Indexed)
    *   `studentId`: `String` (Required, Indexed)
    *   `courseId`: `String` (Required, Indexed)
    *   `date`: `String` (Required, Indexed) – ISO Date format (e.g., `2026-07-05`).
    *   `status`: `String` (Enum: `['present', 'absent', 'late']`, Required)
*   **Indexes**:
    *   `{ id: 1 }` (Unique)
    *   `{ studentId: 1, courseId: 1, date: 1 }` (Compound Unique Index: Guarantees no student can have multiple attendance records for the same course on the same day)
    *   `{ courseId: 1, date: 1 }` (Compound Index for generation of daily course logs)

---

### 10. Announcement Model (`Announcement`)
General notice boards pinned to particular classroom modules.

*   **File Location**: `src/server/models/Announcement.ts`
*   **Database Collection**: `announcements`
*   **Properties**:
    *   `id`: `String` (Unique, Indexed)
    *   `title`: `String` (Required, Trimmed)
    *   `content`: `String` (Required, Trimmed)
    *   `courseId`: `String` (Required, Indexed)
    *   `authorName`: `String` (Required)
    *   `createdAt`: `String` (Required)
*   **Indexes**:
    *   `{ id: 1 }` (Unique)
    *   `{ courseId: 1, createdAt: -1 }` (Compound Index for displaying latest updates on classroom feeds)

---

### 11. AuditLog Model (`AuditLog`)
Comprehensive immutable security ledger mapping system-wide activities.

*   **File Location**: `src/server/models/AuditLog.ts`
*   **Database Collection**: `auditlogs`
*   **Properties**:
    *   `id`: `String` (Unique, Indexed)
    *   `userId`: `String` (Required, Indexed)
    *   `userName`: `String` (Required)
    *   `userEmail`: `String` (Required)
    *   `userRole`: `String` (Enum: `['admin', 'teacher', 'student']`, Required)
    *   `action`: `String` (Required, Indexed) – Identifier action label (e.g., `QUIZ_SUBMIT`).
    *   `details`: `String` (Trimmed) – Plaintext description of event payload details.
    *   `ipAddress`: `String` (Default: `127.0.0.1`) – Origin request IP.
    *   `timestamp`: `String` (Required, Indexed) – ISO timestamp.
*   **Indexes**:
    *   `{ id: 1 }` (Unique)
    *   `{ timestamp: -1 }` (Index for rendering administrative ledger screens)
    *   `{ userId: 1, timestamp: -1 }` (Compound index for auditing a specific user's historic actions)
    *   `{ action: 1, timestamp: -1 }` (Compound index for searching specific actions over time)

---

## 🚀 How to Initialize & Seed the Database

A fully functional, transaction-safe database seeder script is bundled with the project at `src/server/scripts/init-mongodb.ts`.

### Running the Seed Script

To easily seed your MongoDB database with fully populated institutional users, subjects, pre-configured AI quizzes, submissions, sample audit logs, and notification messages:

```bash
# Set your MongoDB URI in .env or run with environment variable override:
MONGODB_URI="mongodb://localhost:27017/eduassess" npm run seed:mongodb
```

The script will:
1.  Connect to the specified MongoDB connection string.
2.  Empty all existing collections safely (`UserModel`, `CourseModel`, `QuizModel`, etc.).
3.  Inject the complete institutional dataset mapping perfectly to the frontend interfaces.
4.  Disconnect cleanly upon completion.
