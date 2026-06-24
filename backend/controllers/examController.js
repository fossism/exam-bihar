const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');

// @desc    Get all exams for a college (Admin/Faculty context)
// @route   GET /api/exams
// @access  Private (Faculty, CollegeAdmin)
const getExams = async (req, res) => {
  const collegeId = req.user.collegeId;

  try {
    const exams = await Exam.find({ collegeId })
      .populate('createdBy', 'name')
      .sort({ startTime: -1 });
    res.json(exams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving exams' });
  }
};

// @desc    Get exams targeted for a student
// @route   GET /api/exams/student
// @access  Private (Student only)
const getStudentExams = async (req, res) => {
  const collegeId = req.user.collegeId;
  const branch = req.user.branch;
  const semester = req.user.semester;
  const studentId = req.user._id;

  try {
    // Find active exams matching student's branch and semester
    const exams = await Exam.find({
      collegeId,
      semester,
      isActive: true,
      $or: [{ branches: { $size: 0 } }, { branches: branch }],
    }).select('-questions'); // Exclude question arrays for security

    // For each exam, check if the student has already started/completed an attempt
    const examStatuses = await Promise.all(
      exams.map(async (exam) => {
        const attempt = await ExamAttempt.findOne({ examId: exam._id, studentId });
        return {
          ...exam.toObject(),
          attemptStatus: attempt ? attempt.status : 'NotStarted',
          attemptId: attempt ? attempt._id : null,
          score: attempt && attempt.isGraded ? attempt.totalScore : null,
          tabSwitches: attempt ? attempt.tabSwitches : 0,
        };
      })
    );

    res.json(examStatuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching student exams' });
  }
};

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Private (All Roles - but with structural filters based on role)
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate({
        path: 'questions',
        select: req.user.role === 'Student' ? '-correctOption -codingTestCases' : '', // Strip answers for students
      })
      .populate('createdBy', 'name');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Verify college context match
    if (exam.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ message: 'Access denied: Exam belongs to another college' });
    }

    // If student, check if they are authorized to view it (branch/semester check)
    if (req.user.role === 'Student') {
      const isTargeted =
        exam.semester === req.user.semester &&
        (exam.branches.length === 0 || exam.branches.includes(req.user.branch));

      if (!isTargeted) {
        return res.status(403).json({ message: 'You are not assigned to this exam' });
      }

      // Check time window
      const now = new Date();
      if (now < exam.startTime) {
        return res.status(403).json({
          message: 'Exam has not started yet',
          startTime: exam.startTime,
        });
      }
    }

    res.json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving exam details' });
  }
};

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private (Faculty only)
const createExam = async (req, res) => {
  const {
    title,
    description,
    subject,
    duration,
    startTime,
    endTime,
    questions,
    branches,
    semester,
    proctoringSettings,
    randomizeQuestions,
  } = req.body;

  try {
    const exam = await Exam.create({
      title,
      description,
      collegeId: req.user.collegeId,
      subject,
      duration,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      questions: questions || [],
      branches: branches || [],
      semester,
      proctoringSettings: proctoringSettings || {
        webcamSnapshots: false,
        fullscreenLock: true,
        tabSwitchLimit: 3,
      },
      randomizeQuestions: randomizeQuestions !== undefined ? randomizeQuestions : true,
      createdBy: req.user._id,
    });

    res.status(201).json(exam);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error creating exam', error: error.message });
  }
};

// @desc    Update an exam
// @route   PUT /api/exams/:id
// @access  Private (Faculty only)
const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ message: 'Access denied: Exam belongs to another college' });
    }

    const {
      title,
      description,
      subject,
      duration,
      startTime,
      endTime,
      questions,
      branches,
      semester,
      proctoringSettings,
      randomizeQuestions,
      isActive,
    } = req.body;

    exam.title = title || exam.title;
    exam.description = description !== undefined ? description : exam.description;
    exam.subject = subject || exam.subject;
    exam.duration = duration || exam.duration;
    exam.startTime = startTime ? new Date(startTime) : exam.startTime;
    exam.endTime = endTime ? new Date(endTime) : exam.endTime;
    exam.questions = questions || exam.questions;
    exam.branches = branches || exam.branches;
    exam.semester = semester !== undefined ? semester : exam.semester;
    exam.proctoringSettings = proctoringSettings || exam.proctoringSettings;
    exam.randomizeQuestions = randomizeQuestions !== undefined ? randomizeQuestions : exam.randomizeQuestions;
    exam.isActive = isActive !== undefined ? isActive : exam.isActive;

    const updatedExam = await exam.save();
    res.json(updatedExam);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error updating exam', error: error.message });
  }
};

// @desc    Delete an exam
// @route   DELETE /api/exams/:id
// @access  Private (Faculty only)
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ message: 'Access denied: Exam belongs to another college' });
    }

    // Check if there are already attempts for this exam
    const attemptsCount = await ExamAttempt.countDocuments({ examId: req.params.id });
    if (attemptsCount > 0) {
      return res.status(400).json({ message: 'Cannot delete exam. Students have already attempted this exam. Deactivate it instead.' });
    }

    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting exam' });
  }
};

module.exports = {
  getExams,
  getStudentExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
};
