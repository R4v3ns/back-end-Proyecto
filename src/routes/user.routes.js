const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const { authenticate } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// Rutas protegidas (requieren autenticación)
router.post('/change-password', authenticate, userController.changePassword);
router.put('/profile', authenticate, userController.updateProfile);
router.get('/preferences', authenticate, userController.getPreferences);
router.put('/preferences', authenticate, userController.updatePreferences);
router.get('/plan', authenticate, userController.getPlan);
router.put('/plan', authenticate, userController.updatePlan);

module.exports = router;

