const jwt = require('jsonwebtoken');
const User = require('../models/User');
const College = require('../models/College');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'exambihar_secret_key_12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (For Students self-signup, and Bootstrap SuperAdmin)
const register = async (req, res) => {
  const { name, email, password, role, collegeId, branch, semester, regNumber } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Determine count of total users to allow initial SuperAdmin bootstrap
    const totalUsersCount = await User.countDocuments({});

    // Enforce role creation hierarchies
    if (role === 'SuperAdmin') {
      if (totalUsersCount > 0) {
        // Only an existing SuperAdmin can create another SuperAdmin (or block it)
        return res.status(403).json({ message: 'SuperAdmin already bootstrapped. Cannot register SuperAdmin publicly.' });
      }
    } else if (role === 'CollegeAdmin') {
      // Must be authenticated as SuperAdmin to create CollegeAdmin
      // (Except during initial setup where we allow creating the first CollegeAdmin easily)
      if (totalUsersCount > 0) {
        return res.status(403).json({ message: 'Unauthorized. Only SuperAdmin can create CollegeAdmin.' });
      }
    } else if (role === 'Faculty') {
      // Must be created by CollegeAdmin
      if (totalUsersCount > 0) {
        return res.status(403).json({ message: 'Unauthorized. Faculty must be registered by CollegeAdmin.' });
      }
    }

    // Validate collegeId for non-SuperAdmin roles
    if (role !== 'SuperAdmin') {
      if (!collegeId) {
        return res.status(400).json({ message: 'College association is required' });
      }
      const college = await College.findById(collegeId);
      if (!college) {
        return res.status(404).json({ message: 'Selected College not found' });
      }
    }

    // Check student-specific fields
    if (role === 'Student') {
      if (!regNumber) {
        return res.status(400).json({ message: 'Registration number is required for students' });
      }
      const regExists = await User.findOne({ regNumber });
      if (regExists) {
        return res.status(400).json({ message: 'Registration number is already registered' });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Student', // Default to Student
      collegeId: role === 'SuperAdmin' ? undefined : collegeId,
      branch: role === 'Student' ? branch : undefined,
      semester: role === 'Student' ? semester : undefined,
      regNumber: role === 'Student' ? regNumber : undefined,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Admin creation of users (CollegeAdmin creating Faculty/Students, SuperAdmin creating CollegeAdmin)
// @route   POST /api/auth/admin-create-user
// @access  Private (SuperAdmin or CollegeAdmin)
const adminCreateUser = async (req, res) => {
  const { name, email, password, role, branch, semester, regNumber } = req.body;
  const creator = req.user;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let targetCollegeId = null;

    if (creator.role === 'SuperAdmin') {
      // SuperAdmin must specify collegeId for the new user, or can create SuperAdmin
      targetCollegeId = req.body.collegeId;
      if (role !== 'SuperAdmin' && !targetCollegeId) {
        return res.status(400).json({ message: 'College ID is required' });
      }
    } else if (creator.role === 'CollegeAdmin') {
      // CollegeAdmin can only create Faculty and Students for their own college
      targetCollegeId = creator.collegeId;
      if (role !== 'Faculty' && role !== 'Student') {
        return res.status(403).json({ message: 'CollegeAdmin can only create Faculty or Student accounts' });
      }
    } else {
      return res.status(403).json({ message: 'Not authorized to create users' });
    }

    if (role === 'Student') {
      if (!regNumber) {
        return res.status(400).json({ message: 'Registration number is required for students' });
      }
      const regExists = await User.findOne({ regNumber });
      if (regExists) {
        return res.status(400).json({ message: 'Registration number already exists' });
      }
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      collegeId: role === 'SuperAdmin' ? undefined : targetCollegeId,
      branch: role === 'Student' ? branch : undefined,
      semester: role === 'Student' ? semester : undefined,
      regNumber: role === 'Student' ? regNumber : undefined,
    });

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      collegeId: newUser.collegeId,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during user creation', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('collegeId', 'name code');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        branch: user.branch,
        semester: user.semester,
        regNumber: user.regNumber,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('collegeId', 'name code');
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        branch: user.branch,
        semester: user.semester,
        regNumber: user.regNumber,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
};

module.exports = { register, adminCreateUser, login, getMe };
