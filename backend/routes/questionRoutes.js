const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('Faculty', 'CollegeAdmin'), getQuestions);
router.get('/:id', authorize('Faculty', 'CollegeAdmin'), getQuestionById);
router.post('/', authorize('Faculty'), createQuestion);
router.put('/:id', authorize('Faculty'), updateQuestion);
router.delete('/:id', authorize('Faculty'), deleteQuestion);
router.post('/bulk-import', authorize('Faculty'), bulkImportQuestions);

module.exports = router;
