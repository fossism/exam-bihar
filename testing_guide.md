# ExamBihar - Step-by-Step Testing & Verification Guide

Follow this guide to initialize the databases, run the servers, and test all four distinct user roles (SuperAdmin, CollegeAdmin, Faculty, Student) along with the anti-cheat shield and code execution sandbox.

---

## 🛠️ Step 1: Initial Server Boot-Up

### 1. Launch the Backend API Server
1. Make sure you have **MongoDB** running locally on its default port (`27017`). If you are using a remote MongoDB Atlas database, update the `MONGO_URI` variable inside the `/backend/.env` file.
2. Open a terminal and navigate to the backend directory:
   ```bash
   cd /home/rohit/Downloads/Examination_System/backend
   ```
3. Install the dependencies (if you haven't already done so on your local system terminal):
   ```bash
   npm install
   ```
4. Seed the database with sample colleges, users, questions, and active exam schedules:
   ```bash
   node seed.js
   ```
5. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
   *You should see log confirmations: `MongoDB connected...` and `Server running on port 5000`.*

### 2. Launch the Frontend Vite Client
1. Open a **second terminal window** or tab.
2. Navigate to the frontend directory:
   ```bash
   cd /home/rohit/Downloads/Examination_System/frontend
   ```
3. Boot the development dev server:
   ```bash
   npm run dev
   ```
4. Open the printed local URL in your browser: `http://localhost:5173`.

---

## 🔑 Test Flow 1: Create College Tenant & Admin (SuperAdmin)
1. On the login screen, log in as the University Super Admin:
   * **Email**: `superadmin@beu.edu.in`
   * **Password**: `admin123`
2. **Verify College Table**: Check that the pre-seeded engineering colleges are listed.
3. **Register New College**:
   * *Name*: `Muzaffarpur Institute of Technology`
   * *Code*: `107`
   * *Campus Location*: `Muzaffarpur`
   * Click **Register College** (Confirm it appears immediately in the table).
4. **Create College Admin**:
   * *Representative Name*: `MIT Registrar Office`
   * *Login Email*: `admin@mitm.edu.in`
   * *Temporary Password*: `college123`
   * *Assign to College*: Select `Muzaffarpur Institute of Technology (107)` from the dropdown.
   * Click **Generate College Admin**.
5. Click **Sign Out** in the sidebar.

---

## 🔑 Test Flow 2: Register Faculty & CSV Student Import (CollegeAdmin)
1. Log in as the seeded admin for Bihar Engineering College Patna (BEUC):
   * **Email**: `admin@beuc.edu.in`
   * **Password**: `college123`
2. **Add Single Faculty**:
   * Under the **Faculty Roster** tab, enter:
     * *Name*: `Dr. Verma`
     * *Email*: `verma@beuc.edu.in`
     * *Password*: `faculty123`
     * Click **Register Faculty** and verify they appear in the table.
3. **Bulk Student Import**:
   * Switch to the **Student Roster** tab.
   * Under **Bulk Import Students (CSV)**, paste this line in the text area:
     ```csv
     Piyush Kumar, piyush@beuc.edu.in, student123, 22105118005, CSE, 6
     ```
   * Click **Import CSV List** and verify Piyush is registered and visible in the student roster table.
4. Click **Sign Out**.

---

## 🔑 Test Flow 3: Question Drafting & Exam Schedules (Faculty)
1. Log in as the pre-seeded instructor:
   * **Email**: `rajesh@beuc.edu.in`
   * **Password**: `faculty123`
2. **Question Bank**:
   * Click **Add New Question** to draft a programming problem.
   * *Subject*: `Computer Networks`
   * *Question Type*: `Coding Problem`
   * *Text*: `Write a JavaScript function reverseString(str) that takes a string and returns it reversed.`
   * *Starter Template*: `function reverseString(str) {\n  // Write code here\n}`
   * *Test Cases (JSON)*: Leave the default sample JSON or write a custom test array.
   * Click **Save Question**.
3. **Exams Scheduler**:
   * Click **Create Exam Schedule**:
     * *Exam Title*: `Networks Mid-Semester Exam`
     * *Subject*: `Computer Networks`
     * *Duration*: `30` minutes
     * *Active Start Time*: Select today's date and a time *slightly in the past*.
     * *Active End Time*: Select tomorrow's date.
     * *Target Semester*: `6`
     * *Target Branches*: `CSE`
     * *Proctoring*: Check **Webcam Proctor Snapshots** and **Strict Fullscreen Lock**. Set Tab Switch Limit to `3`.
     * *Select Questions*: Check the boxes next to the questions you want to include in this exam.
     * Click **Schedule Exam**.
4. Keep this browser window open on the exams list panel.

---

## 🔑 Test Flow 4: Secure Proctor Exam (Student)
1. Open a new Incognito browser window (or log out) and log in as the student candidate:
   * **Email**: `aarav@student.beuc.edu.in`
   * **Password**: `student123`
2. **Exam Lobby**: You should see the `Networks Mid-Semester Exam` scheduled for your Branch (CSE) and Semester (6).
3. Click **Launch Exam Console**.
4. **Allow Webcam Permissions** when prompted. You should see your live stream preview in the bottom-right corner of the sidebar.
5. **Anti-Cheat Fullscreen Shield**:
   * Notice that the console blocks user interaction until you enter fullscreen. Click **Restore Fullscreen Lock**.
   * Press `Esc` to exit fullscreen, or click out of the window to switch tabs.
   * Notice that the anti-cheat shield intercepts this, updates your warning count, and displays a warning dialog. Re-enter fullscreen.
6. **Code Sandbox compilation**:
   * For the coding question, write your code inside the editor.
   * Click **Run Public Test Cases**. Note how the console evaluates your code directly in the browser and outputs green `PASSED` or red `FAILED` test case indicators.
7. Click **Submit Exam** when finished.

---

## 🔑 Test Flow 5: Live Proctoring & Sheet Grading (Faculty)
1. Go back to your Faculty browser window.
2. In the **Exams Scheduler** list, click **Live Proctor** next to the active exam:
   * Verify you can see Aarav's connection status (Active), progress indicator, tab-switch counts, and the latest webcam snapshot.
3. Click the **Evaluation** button next to the exam:
   * Select `Aarav Kumar Singh` from the candidate submission roster.
   * Review their answers. For descriptive/coding questions, slider-input a score, write feedback comments, and click **Save Score**.
   * Click **Finalize & Release Result** (top right) to generate their mark card.
4. Click **Sign Out**.

---

## 🔑 Test Flow 6: Student Marksheet Review (Student)
1. Log back in as the student candidate:
   * **Email**: `aarav@student.beuc.edu.in`
   * **Password**: `student123`
2. Click the **Reports & Grades** tab.
3. Notice that the exam status shows your final score. Click **View Marksheet** to see the detailed report card, including individual questions, your answers, scores, and the feedback left by Dr. Rajesh Kumar.
