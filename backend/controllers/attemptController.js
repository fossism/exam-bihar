const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const User = require('../models/User');

// @desc    Start or resume an exam attempt
// @route   POST /api/attempts/start
// @access  Private (Student only)
const startAttempt = async (req, res) => {
  const { examId } = req.body;
  const studentId = req.user._id;

  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Verify time window
    const now = new Date();
    if (now < exam.startTime || now > exam.endTime) {
      return res.status(400).json({ message: 'Exam window is closed' });
    }

    // Check if attempt already exists
    let attempt = await ExamAttempt.findOne({ examId, studentId });

    if (attempt) {
      if (attempt.status !== 'Started') {
        return res.status(400).json({
          message: 'Exam already submitted or terminated',
          status: attempt.status,
          totalScore: attempt.totalScore,
        });
      }
      
      // Update heartbeat
      attempt.lastHeartbeat = now;
      await attempt.save();
    } else {
      // Create new attempt
      attempt = await ExamAttempt.create({
        studentId,
        examId,
        collegeId: req.user.collegeId,
        startTime: now,
        status: 'Started',
        answers: [],
      });
    }

    // Calculate time remaining based on startTime and exam duration
    const timePassedMs = now - attempt.startTime;
    const durationMs = exam.duration * 60 * 1000;
    const timeRemainingSeconds = Math.max(0, Math.floor((durationMs - timePassedMs) / 1000));

    // Get questions with answers stripped out
    const questions = await Question.find({ _id: { $in: exam.questions } }).select('-correctOption -codingTestCases');

    // Shuffle questions if randomize is active
    let questionList = questions.map(q => q.toObject());
    if (exam.randomizeQuestions) {
      questionList.sort(() => Math.random() - 0.5);
    }

    res.json({
      attemptId: attempt._id,
      status: attempt.status,
      timeRemainingSeconds,
      questions: questionList,
      tabSwitches: attempt.tabSwitches,
      fullscreenViolations: attempt.fullscreenViolations,
      answers: attempt.answers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error starting attempt', error: error.message });
  }
};

// @desc    Auto-save answers in real-time
// @route   POST /api/attempts/:id/save
// @access  Private (Student only)
const saveAnswers = async (req, res) => {
  const attemptId = req.params.id;
  const { answers } = req.body; // Array of { questionId, selectedOption, textAnswer, codeAnswer }

  try {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.status !== 'Started') {
      return res.status(400).json({ message: 'Exam is not in progress. Cannot save answers.' });
    }

    // Verify time limit
    const exam = await Exam.findById(attempt.examId);
    const now = new Date();
    const elapsedMinutes = (now - attempt.startTime) / 60000;
    
    if (elapsedMinutes > exam.duration + 2) { // 2-minute buffer
      attempt.status = 'AutoSubmitted';
      attempt.endTime = now;
      await evaluateMCQs(attempt, exam);
      return res.status(400).json({ message: 'Time limit expired. Attempt autosubmitted.', attempt });
    }

    // Map and update answers
    attempt.answers = answers;
    attempt.lastHeartbeat = now;
    await attempt.save();

    res.json({ message: 'Progress saved successfully', attempt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving answers', error: error.message });
  }
};

// @desc    Log warnings (tab-switches / fullscreen exits)
// @route   POST /api/attempts/:id/warning
// @access  Private (Student only)
const logWarning = async (req, res) => {
  const attemptId = req.params.id;
  const { type } = req.body; // 'tabSwitch' or 'fullscreen'

  try {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.status !== 'Started') {
      return res.status(400).json({ message: 'Exam is closed' });
    }

    const exam = await Exam.findById(attempt.examId);
    
    if (type === 'tabSwitch') {
      attempt.tabSwitches += 1;
      // Auto-submit if limit exceeded
      if (exam.proctoringSettings.tabSwitchLimit > 0 && attempt.tabSwitches >= exam.proctoringSettings.tabSwitchLimit) {
        attempt.status = 'Disqualified';
        attempt.endTime = new Date();
        await evaluateMCQs(attempt, exam);
        await attempt.save();
        return res.json({
          message: 'Exam auto-submitted due to tab switch limit violation',
          disqualified: true,
          attempt,
        });
      }
    } else if (type === 'fullscreen') {
      attempt.fullscreenViolations += 1;
    }

    attempt.lastHeartbeat = new Date();
    await attempt.save();

    res.json({
      message: 'Warning logged',
      tabSwitches: attempt.tabSwitches,
      fullscreenViolations: attempt.fullscreenViolations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error logging warning' });
  }
};

// @desc    Upload webcam snapshot
// @route   POST /api/attempts/:id/snapshot
// @access  Private (Student only)
const uploadSnapshot = async (req, res) => {
  const attemptId = req.params.id;
  const { image } = req.body; // Base64 string

  try {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    attempt.webcamSnapshots.push({ image, timestamp: new Date() });
    attempt.lastHeartbeat = new Date();
    await attempt.save();

    res.json({ message: 'Webcam snapshot stored' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error storing snapshot' });
  }
};

// @desc    Final submit exam attempt
// @route   POST /api/attempts/:id/submit
// @access  Private (Student only)
const submitAttempt = async (req, res) => {
  const attemptId = req.params.id;

  try {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.status !== 'Started') {
      return res.status(400).json({ message: 'Exam has already been submitted' });
    }

    const exam = await Exam.findById(attempt.examId);

    attempt.status = 'Submitted';
    attempt.endTime = new Date();

    // Auto-evaluate MCQ questions
    await evaluateMCQs(attempt, exam);

    res.json({ message: 'Exam submitted successfully', attempt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error submitting exam' });
  }
};

// @desc    Get active attempts for an exam (Proctor Dashboard view)
// @route   GET /api/attempts/exam/:examId
// @access  Private (Faculty, CollegeAdmin)
const getExamAttempts = async (req, res) => {
  const { examId } = req.params;

  try {
    // Populate student information and details
    const attempts = await ExamAttempt.find({ examId })
      .populate('studentId', 'name email regNumber branch semester')
      .sort({ startTime: -1 });

    res.json(attempts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching attempts' });
  }
};

// @desc    Get details of a single attempt (for grading)
// @route   GET /api/attempts/:id
// @access  Private (Faculty, CollegeAdmin, Student)
const getAttemptById = async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.id)
      .populate('studentId', 'name email regNumber branch semester')
      .populate('examId', 'title subject duration startTime endTime');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Security: Student can only view their own attempt, faculty/admin must match college context
    if (req.user.role === 'Student' && attempt.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: Cannot view another student\'s attempt' });
    }

    if (req.user.role !== 'Student' && attempt.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ message: 'Access denied: Attempt belongs to another college' });
    }

    // Populate question details for each answer
    const populatedAnswers = await Promise.all(
      attempt.answers.map(async (ans) => {
        const question = await Question.findById(ans.questionId);
        return {
          ...ans.toObject(),
          question: question ? question.toObject() : null,
        };
      })
    );

    res.json({
      ...attempt.toObject(),
      answers: populatedAnswers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving attempt details' });
  }
};

// @desc    Grade subjective descriptive or coding answer
// @route   PUT /api/attempts/:attemptId/grade
// @access  Private (Faculty only)
const gradeAnswer = async (req, res) => {
  const { attemptId } = req.params;
  const { answerId, evaluatedPoints, feedback } = req.body;

  try {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Find the specific answer within attempt
    const answer = attempt.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Verify question max points
    const question = await Question.findById(answer.questionId);
    if (evaluatedPoints > question.points) {
      return res.status(400).json({ message: `Assigned points cannot exceed question's max points (${question.points})` });
    }

    answer.evaluatedPoints = evaluatedPoints;
    answer.feedback = feedback;
    answer.isEvaluated = true;

    await attempt.save();

    res.json({ message: 'Answer graded successfully', attempt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during grading' });
  }
};

// @desc    Finalize grading for descriptive answers, calculate total score
// @route   POST /api/attempts/:attemptId/finalize
// @access  Private (Faculty only)
const finalizeGrading = async (req, res) => {
  const { attemptId } = req.params;

  try {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Summarize points
    let total = 0;
    attempt.answers.forEach((ans) => {
      total += ans.evaluatedPoints || 0;
    });

    attempt.totalScore = total;
    attempt.isGraded = true;
    
    await attempt.save();

    res.json({ message: 'Grading finalized successfully', attempt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error finalising grades' });
  }
};

// Helper: Auto-evaluate MCQ questions in an attempt
const evaluateMCQs = async (attempt, exam) => {
  try {
    let totalScore = 0;
    let allEvaluated = true;

    // Loop through answers in the attempt
    for (let i = 0; i < attempt.answers.length; i++) {
      const studentAns = attempt.answers[i];
      const question = await Question.findById(studentAns.questionId);

      if (!question) continue;

      if (question.type === 'MCQ') {
        const isCorrect = studentAns.selectedOption === question.correctOption;
        studentAns.evaluatedPoints = isCorrect ? question.points : 0;
        studentAns.isEvaluated = true;
        studentAns.feedback = isCorrect ? 'Correct Answer' : `Incorrect. Correct option was: Option ${question.correctOption + 1}`;
        totalScore += studentAns.evaluatedPoints;
      } else {
        // Descriptive or Coding questions require manual grading or test case run
        allEvaluated = false;
      }
    }

    attempt.totalScore = totalScore;
    
    // If all questions are MCQs, we can mark attempt as fully graded immediately
    if (allEvaluated) {
      attempt.isGraded = true;
    }

    await attempt.save();
  } catch (error) {
    console.error('Error evaluating MCQs:', error);
  }
};

module.exports = {
  startAttempt,
  saveAnswers,
  logWarning,
  uploadSnapshot,
  submitAttempt,
  getExamAttempts,
  getAttemptById,
  gradeAnswer,
  finalizeGrading,
};
