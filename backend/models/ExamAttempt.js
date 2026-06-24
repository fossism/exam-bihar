const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  // Type specific responses
  selectedOption: {
    type: Number, // For MCQ (0-3 index)
  },
  textAnswer: {
    type: String, // For Descriptive
  },
  codeAnswer: {
    type: String, // For Coding
  },
  // Evaluated status
  evaluatedPoints: {
    type: Number,
    default: 0,
  },
  feedback: {
    type: String,
    trim: true,
  },
  isEvaluated: {
    type: Boolean,
    default: false,
  },
});

const snapshotSchema = new mongoose.Schema({
  image: {
    type: String, // Base64 data URI of captured webcam image
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  flagged: {
    type: Boolean, // Flagged if multiple faces or no face detected (optional helper)
    default: false,
  }
});

const examAttemptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
    required: true,
  },
  endTime: {
    type: Date,
  },
  answers: [answerSchema],
  // Proctor logs
  tabSwitches: {
    type: Number,
    default: 0,
  },
  fullscreenViolations: {
    type: Number,
    default: 0,
  },
  webcamSnapshots: [snapshotSchema],
  status: {
    type: String,
    enum: ['Started', 'Submitted', 'Disqualified', 'AutoSubmitted'],
    default: 'Started',
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  isGraded: {
    type: Boolean,
    default: false,
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now, // Used by proctor dashboard to detect if student goes offline
  }
});

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
