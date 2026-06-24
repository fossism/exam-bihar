const express = require('express');
const router = express.Router();
const { register, adminCreateUser, login, getMe } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/admin-create-user', protect, authorize('SuperAdmin', 'CollegeAdmin'), adminCreateUser);

module.exports = router;
