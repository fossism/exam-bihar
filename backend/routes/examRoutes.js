const express = require('express');
const router = express.Router();
const {
  getExams,
  getStudentExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('Faculty', 'CollegeAdmin'), getExams);
router.get('/student', authorize('Student'), getStudentExams);
router.get('/:id', getExamById);
router.post('/', authorize('Faculty'), createExam);
router.put('/:id', authorize('Faculty'), updateExam);
router.delete('/:id', authorize('Faculty'), deleteExam);

module.exports = router;
