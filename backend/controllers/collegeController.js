const College = require('../models/College');
const User = require('../models/User');

// @desc    Get all colleges
// @route   GET /api/colleges
// @access  Public (so registering users can select their college)
const getColleges = async (req, res) => {
  try {
    const colleges = await College.find({}).sort({ name: 1 });
    res.json(colleges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving colleges' });
  }
};

// @desc    Get college by ID
// @route   GET /api/colleges/:id
// @access  Private (SuperAdmin, CollegeAdmin, Faculty)
const getCollegeById = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    res.json(college);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving college details' });
  }
};

// @desc    Create a new college
// @route   POST /api/colleges
// @access  Private (SuperAdmin only)
const createCollege = async (req, res) => {
  const { name, code, location } = req.body;

  if (!name || !code || !location) {
    return res.status(400).json({ message: 'Please provide name, code, and location' });
  }

  try {
    const exists = await College.findOne({ $or: [{ name }, { code }] });
    if (exists) {
      return res.status(400).json({ message: 'College with this name or code already exists' });
    }

    const college = await College.create({ name, code, location });
    res.status(201).json(college);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating college' });
  }
};

// @desc    Delete college
// @route   DELETE /api/colleges/:id
// @access  Private (SuperAdmin only)
const deleteCollege = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Check if there are users associated with this college
    const usersCount = await User.countDocuments({ collegeId: req.params.id });
    if (usersCount > 0) {
      return res.status(400).json({ message: 'Cannot delete college. There are users registered under this college.' });
    }

    await College.findByIdAndDelete(req.params.id);
    res.json({ message: 'College removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing college' });
  }
};

module.exports = {
  getColleges,
  getCollegeById,
  createCollege,
  deleteCollege,
};
