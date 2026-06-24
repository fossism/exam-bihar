const express = require('express');
const router = express.Router();
const {
  startAttempt,
  saveAnswers,
  logWarning,
  uploadSnapshot,
  submitAttempt,
  getExamAttempts,
  getAttemptById,
  gradeAnswer,
  finalizeGrading,
} = require('../controllers/attemptController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/start', authorize('Student'), startAttempt);
router.post('/:id/save', authorize('Student'), saveAnswers);
router.post('/:id/warning', authorize('Student'), logWarning);
router.post('/:id/snapshot', authorize('Student'), uploadSnapshot);
router.post('/:id/submit', authorize('Student'), submitAttempt);

router.get('/exam/:examId', authorize('Faculty', 'CollegeAdmin'), getExamAttempts);
router.get('/:id', getAttemptById);

router.put('/:attemptId/grade', authorize('Faculty'), gradeAnswer);
router.post('/:attemptId/finalize', authorize('Faculty'), finalizeGrading);

module.exports = router;
