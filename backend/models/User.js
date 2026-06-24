const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['SuperAdmin', 'CollegeAdmin', 'Faculty', 'Student'],
    required: true,
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    // Required if role is not SuperAdmin
    required: function() {
      return this.role !== 'SuperAdmin';
    },
  },
  // Student specific fields
  branch: {
    type: String,
    enum: ['CSE', 'ECE', 'EE', 'ME', 'CE', 'IT'],
    required: function() {
      return this.role === 'Student';
    },
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    required: function() {
      return this.role === 'Student';
    },
  },
  regNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows null/missing for non-students without violating unique constraint
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
