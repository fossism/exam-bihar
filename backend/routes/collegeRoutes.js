const express = require('express');
const router = express.Router();
const { getColleges, getCollegeById, createCollege, deleteCollege } = require('../controllers/collegeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getColleges);
router.get('/:id', protect, getCollegeById);
router.post('/', protect, authorize('SuperAdmin'), createCollege);
router.delete('/:id', protect, authorize('SuperAdmin'), deleteCollege);

module.exports = router;
