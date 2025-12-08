const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const { authenticate } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
// Registro
router.post('/register/email', userController.registerWithEmail);
router.post('/register/phone', userController.registerWithPhone);
router.post('/register', userController.register); // Compatibilidad

// Verificación de email
router.post('/verify-email', userController.verifyEmail);
router.post('/resend-email-verification', userController.resendEmailVerification);

// Verificación de teléfono
router.post('/verify-phone', userController.verifyPhone);
router.post('/resend-phone-verification', userController.resendPhoneVerification);

// Login (público)
router.post('/login', userController.login);

// Rutas protegidas (requieren autenticación)
// Logout (ACC-03: debe estar en Perfil o Configuración, requiere autenticación)
router.post('/logout', authenticate, userController.logout);
// Gestión de cuenta
router.get('/me', authenticate, userController.getProfile); // Alias común para obtener perfil
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.post('/change-password', authenticate, userController.changePassword);
router.get('/preferences', authenticate, userController.getPreferences);
router.put('/preferences', authenticate, userController.updatePreferences);
router.get('/plan', authenticate, userController.getPlan);
router.put('/plan', authenticate, userController.updatePlan);

module.exports = router;

