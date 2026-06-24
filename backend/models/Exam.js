const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  // Targeted students
  branches: [{
    type: String,
    enum: ['CSE', 'ECE', 'EE', 'ME', 'CE', 'IT'],
  }],
  semester: {
    type: Number,
    min: 1,
    max: 8,
    required: true,
  },
  proctoringSettings: {
    webcamSnapshots: {
      type: Boolean,
      default: false,
    },
    fullscreenLock: {
      type: Boolean,
      default: true,
    },
    tabSwitchLimit: {
      type: Number,
      default: 3, // Number of allowable tab switches before locking/submitting
    },
  },
  randomizeQuestions: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Exam', examSchema);
