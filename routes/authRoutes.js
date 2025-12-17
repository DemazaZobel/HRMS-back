// routes/authRoutes.js
import express from 'express';
import { signup, login } from '../controllers/authController.js';
import { activityLogger } from '../middleware/activityLogger.js';
import { createAdmin } from '../controllers/authController.js';

const router = express.Router();

// ------------------ ROUTES ------------------

// Signup route
// Log this as a critical user/system event
router.post('/signup', activityLogger('signup', 'Auth'), signup);

// Login route
// Log login attempts (success/failure can also be logged inside controller)
router.post('/login', activityLogger('login', 'Auth'), login);

router.post('/create-admin', activityLogger('create-admin', 'Auth'), createAdmin);

export default router;
