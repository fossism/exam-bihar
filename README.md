# ExamBihar

A multi-tenant online examination system designed for engineering colleges affiliated with Bihar Engineering University (BEU). The system supports role-based administration, exam scheduling, subjective and auto-evaluated grading, and security controls such as full-screen locking, tab-activity tracking, and webcam snapshot logging.

It also features a client-side JavaScript execution sandbox for programming exams, allowing students to run their answers against pre-configured public test cases.

## System Architecture

The application is structured as a monorepo consisting of:
* **Backend API (`/backend`)**: Built with Node.js, Express, and Mongoose (MongoDB). It handles authentication, logs proctor telemetry, stores base64 image snapshots, and processes exam sessions.
* **Frontend SPA (`/frontend`)**: Built with React, Vite, React Router, and Lucide Icons. It uses a custom CSS variables design system with support for dark themes and glassmorphic panels.

---

## Core Features

### 1. Role-Based Administration
* **University Super Admin**: Manages college profiles and provisions College Admin accounts.
* **College Admin**: Registers students (via individual input or bulk CSV copy-paste) and creates Faculty profiles.
* **Faculty/Examiner**: Manages the question bank, configures exam schedules, runs the live proctoring board, and grades submissions.
* **Student**: Accesses active exams, completes tests within a secure window, and views reports cards.

### 2. Exam Security & Proctoring
* **Fullscreen Lock**: The examination console forces fullscreen mode and locks user interaction if the candidate exits.
* **Tab-Switch Telemetry**: The client tracks blur/visibility change events. Exceeding the examiner's configured threshold triggers automatic exam submission and locks the candidate out.
* **Webcam Logging**: Captures frame snapshots from the candidate's camera at intervals and sends them to the server for visual audit.
* **Resilient Offline Backups**: Save states are stored locally in `localStorage` in case of temporary network drops, and synced back to the MongoDB instance when connection is stable.

### 3. Subject Types & Grading
* **Multiple Choice (MCQ)**: Automatically evaluated on exam submission.
* **Descriptive**: Evaluated manually by the assigned examiner.
* **Coding Sandbox**: Provides an editor box for JavaScript answers. Candidates can click "Run Public Test Cases" to execute and test their code against examiner-defined test specs locally.

---

## Installation & Setup

### Requirements
* Node.js (v18+)
* MongoDB (running locally or a connection URI for MongoDB Atlas)

### 1. Set Up the Database and API
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Edit the `.env` file to configure your Mongo connection string and JWT secret:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/exambihar
   JWT_SECRET=your_jwt_secret_key_here
   ```
4. Run the seeder script to populate initial colleges, questions, and test users:
   ```bash
   node seed.js
   ```
5. Start the server:
   ```bash
   npm start
   ```

### 2. Set Up the React Frontend
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

---

## Seed Accounts for Testing

The `seed.js` script populates the database with the following test credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@beu.edu.in` | `admin123` |
| **College Admin** | `admin@beuc.edu.in` | `college123` |
| **Faculty** | `rajesh@beuc.edu.in` | `faculty123` |
| **Student** | `aarav@student.beuc.edu.in` | `student123` |
