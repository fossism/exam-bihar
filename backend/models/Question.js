const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false, // public test cases are visible to students; private test cases are hidden
  }
});

const questionSchema = new mongoose.Schema({
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
  topic: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['MCQ', 'Descriptive', 'Coding'],
    required: true,
    default: 'MCQ',
  },
  text: {
    type: String,
    required: true,
  },
  // MCQ specific fields
  options: {
    type: [String],
    validate: {
      validator: function(v) {
        return this.type !== 'MCQ' || (v && v.length >= 2);
      },
      message: 'MCQ questions must have at least 2 options.',
    },
  },
  correctOption: {
    type: Number, // 0-based index of options array
    validate: {
      validator: function(v) {
        return this.type !== 'MCQ' || (v !== undefined && v >= 0 && v < this.options.length);
      },
      message: 'Correct option index is invalid.',
    },
  },
  // Coding specific fields
  codingTestCases: {
    type: [testCaseSchema],
    validate: {
      validator: function(v) {
        return this.type !== 'Coding' || (v && v.length > 0);
      },
      message: 'Coding questions require at least one test case.',
    },
  },
  codingTemplate: {
    type: String, // Starter boilerplate code
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  points: {
    type: Number,
    required: true,
    default: 1,
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

module.exports = mongoose.model('Question', questionSchema);
