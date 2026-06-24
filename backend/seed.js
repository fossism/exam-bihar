const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load models
const College = require('./models/College');
const User = require('./models/User');
const Question = require('./models/Question');
const Exam = require('./models/Exam');
const ExamAttempt = require('./models/ExamAttempt');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to Database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exambihar');
    console.log('Connected to database for seeding...');

    // Clear existing data
    await College.deleteMany({});
    await User.deleteMany({});
    await Question.deleteMany({});
    await Exam.deleteMany({});
    await ExamAttempt.deleteMany({});
    console.log('Existing database collections cleared.');

    // 1. Create Colleges
    const college1 = await College.create({
      name: 'Bihar Engineering University Campus (BEUC)',
      code: 'BEUC',
      location: 'Patna, Bihar',
    });

    const college2 = await College.create({
      name: 'Muzaffarpur Institute of Technology (MIT)',
      code: 'MITM',
      location: 'Muzaffarpur, Bihar',
    });

    console.log('Colleges seeded successfully.');

    // 2. Create Super Admin
    const superAdminPass = 'admin123';
    const superAdmin = await User.create({
      name: 'BEU Registrar',
      email: 'superadmin@beu.edu.in',
      password: superAdminPass,
      role: 'SuperAdmin',
    });

    // 3. Create College Admin for BEUC
    const collegeAdminPass = 'college123';
    const collegeAdmin = await User.create({
      name: 'Principal Office BEUC',
      email: 'admin@beuc.edu.in',
      password: collegeAdminPass,
      role: 'CollegeAdmin',
      collegeId: college1._id,
    });

    // 4. Create Faculty for BEUC
    const facultyPass = 'faculty123';
    const faculty = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh@beuc.edu.in',
      password: facultyPass,
      role: 'Faculty',
      collegeId: college1._id,
    });

    // 5. Create Students for BEUC
    const studentPass = 'student123';
    const student1 = await User.create({
      name: 'Aarav Kumar Singh',
      email: 'aarav@student.beuc.edu.in',
      password: studentPass,
      role: 'Student',
      collegeId: college1._id,
      branch: 'CSE',
      semester: 6,
      regNumber: '22105118001',
    });

    const student2 = await User.create({
      name: 'Priya Kumari',
      email: 'priya@student.beuc.edu.in',
      password: studentPass,
      role: 'Student',
      collegeId: college1._id,
      branch: 'CSE',
      semester: 6,
      regNumber: '22105118002',
    });

    console.log('Users (SuperAdmin, CollegeAdmin, Faculty, Students) seeded successfully.');

    // 6. Create Questions
    // Q1: MCQ (Easy)
    const q1 = await Question.create({
      collegeId: college1._id,
      subject: 'Operating Systems',
      topic: 'Processes',
      type: 'MCQ',
      text: 'Which of the following process states is NOT standard in an Operating System?',
      options: ['New', 'Ready', 'Executing', 'Waiting'],
      correctOption: 2, // 'Executing' is not standard (Running is standard)
      difficulty: 'Easy',
      points: 2,
      createdBy: faculty._id,
    });

    // Q2: MCQ (Medium)
    const q2 = await Question.create({
      collegeId: college1._id,
      subject: 'Operating Systems',
      topic: 'Memory Management',
      type: 'MCQ',
      text: 'What is thrashing in the context of memory management?',
      options: [
        'High paging activity where the OS spends more time page faulting than executing actual instructions',
        'A physical crash in the secondary hard drive storage partition',
        'A system optimization technique that defragments physical storage blocks',
        'An automatic mechanism that allocates extra dynamic memory blocks to lightweight processes'
      ],
      correctOption: 0,
      difficulty: 'Medium',
      points: 4,
      createdBy: faculty._id,
    });

    // Q3: Descriptive
    const q3 = await Question.create({
      collegeId: college1._id,
      subject: 'Operating Systems',
      topic: 'Virtual Memory',
      type: 'Descriptive',
      text: 'Compare paging and segmentation as memory management schemes. Detail the type of fragmentation (internal vs external) associated with each scheme and how demand paging addresses them.',
      difficulty: 'Medium',
      points: 8,
      createdBy: faculty._id,
    });

    // Q4: Coding Question
    const q4 = await Question.create({
      collegeId: college1._id,
      subject: 'Data Structures',
      topic: 'String Manipulation',
      type: 'Coding',
      text: 'Write a JavaScript function `isPalindrome(str)` that checks whether a given string is a palindrome. The comparison should be case-insensitive and ignore spaces. The function should return `true` or `false`. Example: `isPalindrome("Race car")` should return `true`.',
      difficulty: 'Medium',
      points: 10,
      codingTemplate: `function isPalindrome(str) {
  // Write your code here
  
}`,
      codingTestCases: [
        { input: '"Race car"', output: 'true', isPublic: true },
        { input: '"hello"', output: 'false', isPublic: true },
        { input: '"A man a plan a canal Panama"', output: 'true', isPublic: false }
      ],
      createdBy: faculty._id,
    });

    console.log('Questions seeded successfully.');

    // 7. Create Scheduled Exams
    const now = new Date();
    
    // Active Exam (Starts 10 mins ago, ends in 2 hours)
    const activeExamStart = new Date(now.getTime() - 10 * 60 * 1000);
    const activeExamEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const exam1 = await Exam.create({
      title: 'Operating Systems - CSE 6th Semester Mid-Term',
      description: 'Mid-term evaluation for the Operating Systems (CS-302) course. This exam is actively proctored. Fullscreen and webcam monitoring are enabled. You are allowed a maximum of 3 tab switches.',
      collegeId: college1._id,
      subject: 'Operating Systems',
      duration: 30, // 30 minutes
      startTime: activeExamStart,
      endTime: activeExamEnd,
      questions: [q1._id, q2._id, q3._id, q4._id],
      branches: ['CSE'],
      semester: 6,
      proctoringSettings: {
        webcamSnapshots: true,
        fullscreenLock: true,
        tabSwitchLimit: 3,
      },
      randomizeQuestions: false,
      createdBy: faculty._id,
    });

    // Upcoming Exam (Starts in 2 days, ends in 3 days)
    const upcomingExamStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const upcomingExamEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    await Exam.create({
      title: 'Compiler Design - End Semester mock',
      description: 'Compiler design mock evaluation. General MCQs and syntax analysis theory.',
      collegeId: college1._id,
      subject: 'Compiler Design',
      duration: 60,
      startTime: upcomingExamStart,
      endTime: upcomingExamEnd,
      questions: [q1._id],
      branches: ['CSE'],
      semester: 6,
      proctoringSettings: {
        webcamSnapshots: false,
        fullscreenLock: false,
        tabSwitchLimit: 0,
      },
      randomizeQuestions: true,
      createdBy: faculty._id,
    });

    console.log('Exams seeded successfully.');
    console.log('\n=========================================');
    console.log('SEEDING SUMMARY & MOCK USER CREDENTIALS:');
    console.log('=========================================');
    console.log(`1. Super Admin (BEU Registrar):`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: ${superAdminPass}`);
    console.log(`2. College Admin (BEUC):`);
    console.log(`   Email: ${collegeAdmin.email}`);
    console.log(`   Password: ${collegeAdminPass}`);
    console.log(`3. Faculty (BEUC Examiner):`);
    console.log(`   Email: ${faculty.email}`);
    console.log(`   Password: ${facultyPass}`);
    console.log(`4. Student 1 (Aarav - CSE Sem 6):`);
    console.log(`   Email: ${student1.email}`);
    console.log(`   Password: ${studentPass}`);
    console.log(`5. Student 2 (Priya - CSE Sem 6):`);
    console.log(`   Email: ${student2.email}`);
    console.log(`   Password: ${studentPass}`);
    console.log('=========================================\n');

    mongoose.connection.close();
    console.log('Seeding completed and connection closed.');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
