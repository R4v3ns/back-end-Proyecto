const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Utils (set your env secret or use a default for development)
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret';
const JWT_EXPIRES_IN = '12h';
const APP_NAME = process.env.APP_NAME || 'Mi Aplicación';

// Helper: generate JWT
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Helper: generate verification token
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper: generate phone verification code (6 digits)
function generatePhoneVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Validar formato de email
function validateEmail(email) {
  if (!email) {
    return { valid: false, error: 'El correo electrónico es requerido' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'El correo electrónico debe tener un formato válido (ejemplo@dominio.com)' };
  }
  return { valid: true };
}

// Helper: Validar contraseña
function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'La contraseña es requerida' };
  }
  if (password.length < 8 || password.length > 15) {
    return { valid: false, error: 'La contraseña debe tener entre 8 y 15 caracteres' };
  }
  // Debe contener al menos una mayúscula, una minúscula, un número y un símbolo
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!passwordRegex.test(password)) {
    return { 
      valid: false, 
      error: 'La contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un símbolo' 
    };
  }
  return { valid: true };
}

// Helper: Validar confirmación de contraseña
function validatePasswordConfirmation(password, passwordConfirmation) {
  if (!passwordConfirmation) {
    return { valid: false, error: 'La confirmación de contraseña es requerida' };
  }
  if (password !== passwordConfirmation) {
    return { valid: false, error: 'Las contraseñas no coinciden' };
  }
  return { valid: true };
}

// Helper: Validar teléfono
function validatePhone(phone) {
  if (!phone) {
    return { valid: false, error: 'El número de teléfono es requerido' };
  }
  // Formato E.164 básico
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'El número de teléfono debe tener un formato válido' };
  }
  return { valid: true };
}

// Helper: Validar términos y privacidad
function validateTermsAndPrivacy(termsAccepted, privacyAccepted) {
  const termsAcceptedBool = termsAccepted === true || termsAccepted === 'true';
  const privacyAcceptedBool = privacyAccepted === true || privacyAccepted === 'true';
  
  if (!termsAcceptedBool) {
    return { valid: false, error: 'Debes aceptar los términos y condiciones' };
  }
  if (!privacyAcceptedBool) {
    return { valid: false, error: 'Debes aceptar la política de privacidad' };
  }
  return { valid: true, termsAccepted: termsAcceptedBool, privacyAccepted: privacyAcceptedBool };
}

// Helper: Validar token de verificación
function validateVerificationToken(token) {
  if (!token) {
    return { valid: false, error: 'El token de verificación es requerido' };
  }
  return { valid: true };
}

// Helper: format user response (exclude sensitive data and map fields for frontend)
function formatUserResponse(user) {
  const userObj = user.toJSON ? user.toJSON() : user;
  const {
    password,
    verificationToken,
    emailVerificationTokenExpires,
    resetPasswordToken,
    resetPasswordExpires,
    phoneVerificationToken,
    phoneVerificationTokenExpires,
    ...safeUser
  } = userObj;
  
  // Mapear campos del backend a los que espera el frontend
  const formattedUser = {
    ...safeUser,
    // Mapear bio -> biography
    biography: safeUser.bio || undefined,
    // Mapear dateOfBirth -> birthDate (mantener ambos para compatibilidad)
    birthDate: safeUser.dateOfBirth || undefined,
    // Mapear avatar -> profileImage
    profileImage: safeUser.avatar || undefined,
    // Generar campo name combinando firstName y lastName
    name: safeUser.firstName && safeUser.lastName 
      ? `${safeUser.firstName} ${safeUser.lastName}`.trim()
      : safeUser.firstName || safeUser.lastName || undefined,
  };
  
  // Remover campos undefined para limpiar la respuesta
  Object.keys(formattedUser).forEach(key => {
    if (formattedUser[key] === undefined) {
      delete formattedUser[key];
    }
  });
  
  return formattedUser;
}

// Helper: check if account exists and return helpful message
async function checkExistingAccount(email, phone) {
  if (email) {
    const userByEmail = await User.findOne({ where: { email } });
    if (userByEmail) {
      return {
        exists: true,
        field: 'email',
        message: 'Ya existe una cuenta asociada a este correo electrónico. ¿Deseas iniciar sesión o recuperar tu contraseña?',
        suggestions: ['iniciar_sesion', 'recuperar_contraseña'],
      };
    }
  }

  if (phone) {
    const userByPhone = await User.findOne({ where: { phone } });
    if (userByPhone) {
      return {
        exists: true,
        field: 'phone',
        message: 'Ya existe una cuenta asociada a este número de teléfono. ¿Deseas iniciar sesión o recuperar tu contraseña?',
        suggestions: ['iniciar_sesion', 'recuperar_contraseña'],
      };
    }
  }

  return { exists: false };
}

// Register with email
exports.registerWithEmail = async (req, res) => {
  try {
    const { email, password, passwordConfirmation, firstName, lastName, termsAccepted, privacyAccepted } = req.body;

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: emailValidation.error,
        field: 'email',
      });
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: passwordValidation.error,
        field: 'password',
      });
    }

    // Validar confirmación de contraseña
    const passwordConfirmationValidation = validatePasswordConfirmation(password, passwordConfirmation);
    if (!passwordConfirmationValidation.valid) {
      return res.status(400).json({
        error: passwordConfirmationValidation.error,
        field: 'passwordConfirmation',
      });
    }

    // Validar términos y privacidad
    const termsValidation = validateTermsAndPrivacy(termsAccepted, privacyAccepted);
    if (!termsValidation.valid) {
      return res.status(400).json({
        error: termsValidation.error,
      });
    }

    // Verificar si la cuenta ya existe
    const accountCheck = await checkExistingAccount(email, null);
    if (accountCheck.exists) {
      return res.status(409).json({
        error: accountCheck.message,
        field: accountCheck.field,
        suggestions: accountCheck.suggestions,
      });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Generar token de verificación
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Crear usuario
    const user = await User.create({
      email,
      password: hash,
      firstName,
      lastName,
      termsAccepted: termsValidation.termsAccepted,
      privacyAccepted: termsValidation.privacyAccepted,
      termsAcceptedAt: new Date(),
      preferences: {
        language: 'es',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      plan: 'free',
      planStartDate: new Date(),
      planEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      planStatus: 'active',
      isActive: true,
      isVerified: false,
      verificationToken,
      emailVerificationTokenExpires: verificationTokenExpires,
      phoneVerified: false,
    });

    // TODO: Enviar email de verificación (implementar servicio de email)
    // Por ahora, retornamos el token en la respuesta (solo para desarrollo)
    // En producción, esto NO debe enviarse en la respuesta

    // Construir mensaje de bienvenida
    const welcomeMessage = user.firstName 
      ? `¡Bienvenido, ${user.firstName}! Tu cuenta ha sido creada exitosamente.`
      : '¡Bienvenido! Tu cuenta ha sido creada exitosamente.';

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Por favor, verifica tu correo electrónico para activar tu cuenta.',
      welcome: welcomeMessage,
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined, // Solo en desarrollo
      instructions: 'Revisa tu correo electrónico y haz clic en el enlace de verificación. Si no recibes el correo, puedes solicitar un nuevo enlace.',
      nextSteps: ['Verificar tu correo electrónico', 'Completar tu perfil'],
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Ya existe una cuenta con este correo electrónico',
        suggestions: ['iniciar_sesion', 'recuperar_contraseña'],
      });
    }
    res.status(500).json({ error: err.message });
  }
};

// Register with phone
exports.registerWithPhone = async (req, res) => {
  try {
    const { phone, password, passwordConfirmation, firstName, lastName, termsAccepted, privacyAccepted } = req.body;

    // Validar teléfono
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        error: phoneValidation.error,
        field: 'phone',
      });
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: passwordValidation.error,
        field: 'password',
      });
    }

    // Validar confirmación de contraseña
    const passwordConfirmationValidation = validatePasswordConfirmation(password, passwordConfirmation);
    if (!passwordConfirmationValidation.valid) {
      return res.status(400).json({
        error: passwordConfirmationValidation.error,
        field: 'passwordConfirmation',
      });
    }

    // Validar términos y privacidad
    const termsValidation = validateTermsAndPrivacy(termsAccepted, privacyAccepted);
    if (!termsValidation.valid) {
      return res.status(400).json({
        error: termsValidation.error,
      });
    }

    // Verificar si la cuenta ya existe
    const accountCheck = await checkExistingAccount(null, phone);
    if (accountCheck.exists) {
      return res.status(409).json({
        error: accountCheck.message,
        field: accountCheck.field,
        suggestions: accountCheck.suggestions,
      });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Generar código de verificación de teléfono
    const phoneVerificationToken = generatePhoneVerificationCode();
    const phoneVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Crear usuario
    const user = await User.create({
      phone,
      password: hash,
      firstName,
      lastName,
      termsAccepted: termsValidation.termsAccepted,
      privacyAccepted: termsValidation.privacyAccepted,
      termsAcceptedAt: new Date(),
      preferences: {
        language: 'es',
        notifications: {
          email: false,
          push: true,
          sms: true,
        },
      },
      plan: 'free',
      planStartDate: new Date(),
      planEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      planStatus: 'active',
      isActive: true,
      isVerified: false,
      phoneVerified: false,
      phoneVerificationToken,
      phoneVerificationTokenExpires,
    });

    // TODO: Enviar SMS con código de verificación (implementar servicio de SMS)
    // Por ahora, retornamos el código en la respuesta (solo para desarrollo)
    // En producción, esto NO debe enviarse en la respuesta

    // Construir mensaje de bienvenida
    const welcomeMessage = user.firstName 
      ? `¡Bienvenido, ${user.firstName}! Tu cuenta ha sido creada exitosamente.`
      : '¡Bienvenido! Tu cuenta ha sido creada exitosamente.';

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Por favor, verifica tu número de teléfono.',
      welcome: welcomeMessage,
      userId: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      verificationCode: process.env.NODE_ENV === 'development' ? phoneVerificationToken : undefined, // Solo en desarrollo
      instructions: 'Revisa tu teléfono y ingresa el código de verificación de 6 dígitos que te enviamos por SMS.',
      nextSteps: ['Verificar tu número de teléfono', 'Completar tu perfil'],
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Ya existe una cuenta con este número de teléfono',
        suggestions: ['iniciar_sesion', 'recuperar_contraseña'],
      });
    }
    res.status(500).json({ error: err.message });
  }
};

// Mantener el método register original para compatibilidad (puede eliminarse si no se usa)
exports.register = exports.registerWithEmail;

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Validar token
    const tokenValidation = validateVerificationToken(token);
    if (!tokenValidation.valid) {
      return res.status(400).json({
        error: tokenValidation.error,
        field: 'token',
      });
    }

    const user = await User.findOne({ where: { verificationToken: token } });
    
    if (!user) {
      return res.status(400).json({
        error: 'Token de verificación inválido o expirado',
        message: 'El token proporcionado no es válido. Por favor, solicita un nuevo enlace de verificación.',
      });
    }

    // Verificar si el token expiró
    if (user.emailVerificationTokenExpires && new Date() > user.emailVerificationTokenExpires) {
      return res.status(400).json({
        error: 'Token de verificación expirado',
        message: 'El token de verificación ha expirado. Por favor, solicita un nuevo enlace de verificación.',
      });
    }

    // Verificar email
    user.isVerified = true;
    user.verificationToken = null;
    user.emailVerificationTokenExpires = null;
    await user.save();

    // Construir mensaje de bienvenida
    const welcomeMessage = user.firstName 
      ? `¡Bienvenido, ${user.firstName}! Tu cuenta ha sido verificada y está lista para usar.`
      : '¡Bienvenido! Tu cuenta ha sido verificada y está lista para usar.';

    res.json({
      message: 'Correo electrónico verificado exitosamente',
      welcome: welcomeMessage,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
      },
      ready: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Resend email verification
exports.resendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: emailValidation.error,
        field: 'email',
      });
    }

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se encontró una cuenta con este correo electrónico.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        error: 'Correo ya verificado',
        message: 'Este correo electrónico ya ha sido verificado.',
      });
    }

    // Generar nuevo token de verificación
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    user.verificationToken = verificationToken;
    user.emailVerificationTokenExpires = verificationTokenExpires;
    await user.save();

    // TODO: Enviar email de verificación (implementar servicio de email)
    // Por ahora, retornamos el token en la respuesta (solo para desarrollo)
    // En producción, esto NO debe enviarse en la respuesta

    res.json({
      message: 'Se ha enviado un nuevo enlace de verificación a tu correo electrónico.',
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined, // Solo en desarrollo
      instructions: 'Revisa tu correo electrónico y haz clic en el enlace de verificación.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Verify phone
exports.verifyPhone = async (req, res) => {
  try {
    const { phone, verificationCode } = req.body;

    // Validar teléfono
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        error: phoneValidation.error,
        field: 'phone',
      });
    }

    // Validar código de verificación
    if (!verificationCode) {
      return res.status(400).json({
        error: 'El código de verificación es requerido',
        field: 'verificationCode',
      });
    }
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      return res.status(400).json({
        error: 'El código de verificación debe tener exactamente 6 dígitos',
        field: 'verificationCode',
      });
    }

    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se encontró una cuenta con este número de teléfono.',
      });
    }

    if (user.phoneVerified) {
      return res.status(400).json({
        error: 'Teléfono ya verificado',
        message: 'Este número de teléfono ya ha sido verificado.',
      });
    }

    // Verificar si el código expiró
    if (user.phoneVerificationTokenExpires && new Date() > user.phoneVerificationTokenExpires) {
      return res.status(400).json({
        error: 'Código de verificación expirado',
        message: 'El código de verificación ha expirado. Por favor, solicita un nuevo código.',
      });
    }

    // Verificar el código
    if (user.phoneVerificationToken !== verificationCode) {
      return res.status(400).json({
        error: 'Código de verificación incorrecto',
        message: 'El código ingresado no es válido. Por favor, verifica el código e intenta nuevamente.',
      });
    }

    // Verificar teléfono
    user.phoneVerified = true;
    user.phoneVerificationToken = null;
    user.phoneVerificationTokenExpires = null;
    await user.save();

    // Construir mensaje de bienvenida
    const welcomeMessage = user.firstName 
      ? `¡Bienvenido, ${user.firstName}! Tu cuenta ha sido verificada y está lista para usar.`
      : '¡Bienvenido! Tu cuenta ha sido verificada y está lista para usar.';

    res.json({
      message: 'Número de teléfono verificado exitosamente',
      welcome: welcomeMessage,
      user: {
        id: user.id,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ready: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Resend phone verification code
exports.resendPhoneVerification = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validar teléfono
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        error: phoneValidation.error,
        field: 'phone',
      });
    }

    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se encontró una cuenta con este número de teléfono.',
      });
    }

    if (user.phoneVerified) {
      return res.status(400).json({
        error: 'Teléfono ya verificado',
        message: 'Este número de teléfono ya ha sido verificado.',
      });
    }

    // Generar nuevo código de verificación
    const phoneVerificationToken = generatePhoneVerificationCode();
    const phoneVerificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    user.phoneVerificationToken = phoneVerificationToken;
    user.phoneVerificationTokenExpires = phoneVerificationTokenExpires;
    await user.save();

    // TODO: Enviar SMS con código de verificación (implementar servicio de SMS)
    // Por ahora, retornamos el código en la respuesta (solo para desarrollo)
    // En producción, esto NO debe enviarse en la respuesta

    res.json({
      message: 'Se ha enviado un nuevo código de verificación a tu teléfono.',
      verificationCode: process.env.NODE_ENV === 'development' ? phoneVerificationToken : undefined, // Solo en desarrollo
      instructions: 'Revisa tu teléfono y ingresa el código de verificación de 6 dígitos.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login (ACC-02)
exports.login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Validar que se proporcione email o teléfono
    if (!email && !phone) {
      return res.status(400).json({ 
        error: 'Debes proporcionar un correo electrónico o número de teléfono',
        field: 'email'
      });
    }

    // Validar que se proporcione contraseña
    if (!password) {
      return res.status(400).json({ 
        error: 'La contraseña es requerida',
        field: 'password'
      });
    }

    // Buscar usuario por email o teléfono
    let user;
    if (email) {
      // Validar formato de email
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({
          error: emailValidation.error,
          field: 'email',
        });
      }
      user = await User.findOne({ where: { email } });
    } else if (phone) {
      // Validar formato de teléfono
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({
          error: phoneValidation.error,
          field: 'phone',
        });
      }
      user = await User.findOne({ where: { phone } });
    }

    // Verificar si el usuario existe
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'No se encontró una cuenta con las credenciales proporcionadas'
      });
    }

    // Verificar si la cuenta está activa
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Cuenta desactivada',
        message: 'Tu cuenta ha sido desactivada. Por favor, contacta al soporte.'
      });
    }

    // Verificar contraseña
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'La contraseña proporcionada es incorrecta',
        field: 'password'
      });
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Generar token
    const token = generateToken(user);

    // Mensaje de bienvenida
    const welcomeMessage = user.firstName 
      ? `¡Bienvenido de nuevo, ${user.firstName}!`
      : '¡Bienvenido de nuevo!';

    res.json({ 
      message: 'Inicio de sesión exitoso',
      welcome: welcomeMessage,
      token, 
      user: formatUserResponse(user) 
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ 
      error: 'Error al iniciar sesión',
      message: err.message 
    });
  }
};

// Logout (ACC-03)
exports.logout = async (req, res) => {
  try {
    // El logout es principalmente manejado en el cliente eliminando el token
    // Sin embargo, podemos registrar el evento si es necesario
    
    // Si hay un usuario autenticado (opcional, para logging)
    if (req.user) {
      // Aquí podrías registrar el logout en un log o base de datos si es necesario
      // Por ahora, solo confirmamos el logout
    }

    res.json({ 
      message: 'Sesión cerrada exitosamente',
      success: true
    });
  } catch (err) {
    // Aunque haya un error, confirmamos el logout en el cliente
    console.error('Error en logout:', err);
    res.json({ 
      message: 'Sesión cerrada',
      success: true,
      note: 'Si hubo algún problema, por favor elimina el token localmente'
    });
  }
};

// Change Password (ACC-04)
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // req.user populated by authentication middleware
    const { currentPassword, newPassword, passwordConfirmation } = req.body;

    // Validar que se proporcione la contraseña actual
    if (!currentPassword) {
      return res.status(400).json({ 
        error: 'La contraseña actual es requerida',
        field: 'currentPassword'
      });
    }

    // Validar que se proporcione la nueva contraseña
    if (!newPassword) {
      return res.status(400).json({ 
        error: 'La nueva contraseña es requerida',
        field: 'newPassword'
      });
    }

    // Validar que se proporcione la confirmación
    if (!passwordConfirmation) {
      return res.status(400).json({ 
        error: 'La confirmación de contraseña es requerida',
        field: 'passwordConfirmation'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Validar contraseña actual
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ 
        error: 'La contraseña actual es incorrecta',
        message: 'La contraseña actual que ingresaste no coincide con la registrada',
        field: 'currentPassword'
      });
    }

    // Validar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        error: 'La nueva contraseña debe ser diferente a la actual',
        message: 'Por favor, elige una contraseña diferente a la que estás usando actualmente',
        field: 'newPassword'
      });
    }

    // Validar nueva contraseña
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: passwordValidation.error,
        field: 'newPassword',
      });
    }

    // Validar confirmación de contraseña
    const passwordConfirmationValidation = validatePasswordConfirmation(newPassword, passwordConfirmation);
    if (!passwordConfirmationValidation.valid) {
      return res.status(400).json({
        error: passwordConfirmationValidation.error,
        field: 'passwordConfirmation',
      });
    }

    // Actualizar contraseña
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ 
      message: 'Tu contraseña fue actualizada',
      success: true
    });
  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    res.status(500).json({ 
      error: 'Error al cambiar la contraseña',
      message: err.message 
    });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Formatear usuario para el frontend
    const formattedUser = formatUserResponse(user);
    
    // Devolver en el formato que espera el frontend
    // El frontend espera los campos directamente en la respuesta
    res.json({ 
      ...formattedUser, // Campos directamente en la raíz
      user: formattedUser // También en objeto user para compatibilidad
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Profile (ACC-05)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // req.user should be set by auth middleware
    
    // Mapear campos del frontend a los del backend
    const updates = {};
    
    // Manejar username (alias)
    if (req.body.username !== undefined) {
      if (req.body.username && req.body.username.trim()) {
        const trimmedUsername = req.body.username.trim();
        
        // Validar longitud mínima del username
        if (trimmedUsername.length < 3) {
          return res.status(400).json({ 
            error: 'El nombre de usuario debe tener al menos 3 caracteres',
            field: 'username'
          });
        }
        
        // Validar formato del username (solo letras, números, guiones y guiones bajos)
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
          return res.status(400).json({ 
            error: 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos',
            field: 'username'
          });
        }
        
        // Verificar que el username no esté en uso por otro usuario
        const existingUser = await User.findOne({ 
          where: { 
            username: trimmedUsername,
            id: { [require('sequelize').Op.ne]: userId } // Excluir el usuario actual
          } 
        });
        
        if (existingUser) {
          return res.status(409).json({ 
            error: 'El nombre de usuario ya está en uso',
            message: 'Este nombre de usuario ya está siendo utilizado por otra cuenta',
            field: 'username'
          });
        }
        
        updates.username = trimmedUsername;
      } else {
        updates.username = null;
      }
    }
    
    // Manejar firstName y lastName (nombre)
    // Prioridad: si vienen firstName/lastName directamente, usarlos
    // Si no, pero viene name, dividirlo
    if (req.body.firstName !== undefined || req.body.lastName !== undefined) {
      if (req.body.firstName !== undefined) {
        updates.firstName = req.body.firstName ? req.body.firstName.trim() : null;
      }
      if (req.body.lastName !== undefined) {
        updates.lastName = req.body.lastName ? req.body.lastName.trim() : null;
      }
    } else if (req.body.name) {
      // Si no vienen firstName/lastName pero viene name, dividirlo
      const nameParts = req.body.name.trim().split(' ').filter(part => part.length > 0);
      if (nameParts.length > 0) {
        updates.firstName = nameParts[0];
        updates.lastName = nameParts.slice(1).join(' ') || null;
      }
    }
    
    // Mapear biography -> bio
    if (req.body.biography !== undefined) {
      updates.bio = req.body.biography ? req.body.biography.trim() : null;
    }
    if (req.body.bio !== undefined) {
      updates.bio = req.body.bio ? req.body.bio.trim() : null;
    }
    
    // Mapear birthDate -> dateOfBirth
    if (req.body.birthDate !== undefined) {
      if (req.body.birthDate) {
        const birthDate = new Date(req.body.birthDate);
        if (isNaN(birthDate.getTime())) {
          return res.status(400).json({ 
            error: 'La fecha de nacimiento no es válida',
            field: 'birthDate'
          });
        }
        // Validar que no sea una fecha futura
        if (birthDate > new Date()) {
          return res.status(400).json({ 
            error: 'La fecha de nacimiento no puede ser una fecha futura',
            field: 'birthDate'
          });
        }
        updates.dateOfBirth = birthDate;
      } else {
        updates.dateOfBirth = null;
      }
    }
    if (req.body.dateOfBirth !== undefined) {
      if (req.body.dateOfBirth) {
        const birthDate = new Date(req.body.dateOfBirth);
        if (isNaN(birthDate.getTime())) {
          return res.status(400).json({ 
            error: 'La fecha de nacimiento no es válida',
            field: 'dateOfBirth'
          });
        }
        if (birthDate > new Date()) {
          return res.status(400).json({ 
            error: 'La fecha de nacimiento no puede ser una fecha futura',
            field: 'dateOfBirth'
          });
        }
        updates.dateOfBirth = birthDate;
      } else {
        updates.dateOfBirth = null;
      }
    }
    
    // Mapear profileImage -> avatar (foto)
    if (req.body.profileImage !== undefined) {
      updates.avatar = req.body.profileImage || null;
    }
    if (req.body.avatar !== undefined) {
      updates.avatar = req.body.avatar || null;
    }
    
    // Validar teléfono si se proporciona
    if (req.body.phone !== undefined) {
      if (req.body.phone) {
        const phoneValidation = validatePhone(req.body.phone);
        if (!phoneValidation.valid) {
          return res.status(400).json({
            error: phoneValidation.error,
            field: 'phone',
          });
        }
        
        // Verificar que el teléfono no esté en uso por otro usuario
        const existingUser = await User.findOne({ 
          where: { 
            phone: req.body.phone,
            id: { [require('sequelize').Op.ne]: userId }
          } 
        });
        
        if (existingUser) {
          return res.status(409).json({ 
            error: 'Este número de teléfono ya está asociado a otra cuenta',
            field: 'phone'
          });
        }
      }
      updates.phone = req.body.phone || null;
    }
    
    // Si no hay actualizaciones, retornar error
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron campos para actualizar',
        message: 'Debes proporcionar al menos un campo para actualizar tu perfil'
      });
    }
    
    // Actualizar usuario
    const [affectedRows] = await User.update(updates, {
      where: { id: userId }
    });

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener el usuario actualizado
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Devolver la respuesta en el formato que espera el frontend
    const formattedUser = formatUserResponse(user);
    
    res.json({ 
      message: 'Perfil actualizado exitosamente',
      ...formattedUser, // Incluir campos directamente en la respuesta para compatibilidad
      user: formattedUser // También incluir en objeto user
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        error: 'Uno de los campos que intentas actualizar ya está en uso',
        message: err.message
      });
    }
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ 
      error: 'Error al actualizar el perfil',
      message: err.message 
    });
  }
};

// Update Preferences (ACC-06)
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('📝 Update Preferences - Request body:', req.body);

    // Aceptar datos directamente en el body o dentro de un objeto 'preferences'
    const updateData = req.body.preferences || req.body;

    // Verificar que se hayan proporcionado datos para actualizar
    // Permitir valores null/empty string para resetear valores
    const hasUpdates = 'language' in updateData || 
                      'theme' in updateData || 
                      'explicitContent' in updateData ||
                      'notifications' in updateData ||
                      'timezone' in updateData;

    if (!hasUpdates) {
      return res.status(400).json({ 
        error: 'No se proporcionaron datos para actualizar',
        message: 'Debes proporcionar al menos un campo para actualizar (language, theme, explicitContent, notifications, timezone)'
      });
    }

    // Obtener preferencias actuales usando getDataValue para obtener el string raw
    let preferences = {};
    const rawPreferences = user.getDataValue('preferences');
    
    if (rawPreferences) {
      try {
        preferences = typeof rawPreferences === 'string' 
          ? JSON.parse(rawPreferences) 
          : rawPreferences;
      } catch (parseError) {
        console.error('Error al parsear preferencias:', parseError);
        preferences = {
          language: 'es',
          theme: 'light',
          explicitContent: false,
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          timezone: 'America/Mexico_City',
        };
      }
    } else {
      // Preferencias por defecto si no existen
      preferences = {
        language: 'es',
        theme: 'light',
        explicitContent: false,
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        timezone: 'America/Mexico_City',
      };
    }

    console.log('📝 Preferencias actuales:', preferences);
    console.log('📝 Datos recibidos para actualizar:', updateData);

    // Validar y actualizar idioma
    const validLanguages = ['es', 'en', 'fr', 'pt', 'de', 'it'];
    if ('language' in updateData) {
      if (updateData.language !== null && updateData.language !== undefined && updateData.language !== '') {
        const languageValue = String(updateData.language).trim().toLowerCase();
        console.log('🔍 Validando idioma:', languageValue, 'Valores válidos:', validLanguages);
        if (validLanguages.includes(languageValue)) {
          preferences.language = languageValue;
          console.log('✅ Idioma actualizado a:', languageValue);
        } else {
          console.log('❌ Idioma no válido:', languageValue);
          return res.status(400).json({ 
            error: 'Idioma no válido',
            message: `El idioma debe ser uno de: ${validLanguages.join(', ')}`,
            field: 'language',
            received: languageValue
          });
        }
      }
    }

    // Validar y actualizar tema
    const validThemes = ['light', 'dark', 'auto'];
    if ('theme' in updateData) {
      if (updateData.theme !== null && updateData.theme !== undefined && updateData.theme !== '') {
        const themeValue = String(updateData.theme).trim().toLowerCase();
        console.log('🔍 Validando tema:', themeValue, 'Valores válidos:', validThemes);
        if (validThemes.includes(themeValue)) {
          preferences.theme = themeValue;
          console.log('✅ Tema actualizado a:', themeValue);
        } else {
          console.log('❌ Tema no válido:', themeValue);
          return res.status(400).json({ 
            error: 'Tema no válido',
            message: `El tema debe ser uno de: ${validThemes.join(', ')}`,
            field: 'theme',
            received: themeValue
          });
        }
      }
    }

    // Actualizar contenido explícito
    if (updateData.explicitContent !== undefined) {
      preferences.explicitContent = updateData.explicitContent === true || updateData.explicitContent === 'true' || updateData.explicitContent === 1;
      console.log('✅ Contenido explícito actualizado a:', preferences.explicitContent);
    }

    // Actualizar notificaciones
    if (updateData.notifications !== undefined) {
      preferences.notifications = {
        ...preferences.notifications,
        ...updateData.notifications
      };
      console.log('✅ Notificaciones actualizadas');
    }

    // Actualizar timezone
    if (updateData.timezone !== undefined) {
      preferences.timezone = updateData.timezone;
      console.log('✅ Timezone actualizado a:', updateData.timezone);
    }

    console.log('📝 Preferencias finales a guardar:', preferences);

    // Guardar preferencias directamente como string JSON usando setDataValue
    // Esto evita problemas con el setter/getter del modelo
    const preferencesString = JSON.stringify(preferences);
    console.log('📝 String JSON a guardar:', preferencesString);
    
    user.setDataValue('preferences', preferencesString);
    await user.save();

    // Verificar que se guardó correctamente
    const savedRaw = user.getDataValue('preferences');
    console.log('📝 Verificación - Raw guardado:', savedRaw);
    
    // Recargar el usuario desde la base de datos para obtener las preferencias parseadas
    await user.reload();
    
    // Obtener preferencias parseadas
    const savedPreferences = user.preferences;
    console.log('✅ Preferencias guardadas exitosamente');
    console.log('📝 Preferencias después de guardar:', savedPreferences);

    res.json({ 
      message: 'Preferencias actualizadas exitosamente',
      preferences: user.preferences 
    });
  } catch (err) {
    console.error('❌ Error al actualizar preferencias:', err);
    res.status(500).json({ 
      error: 'Error al actualizar las preferencias',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Get Preferences (ACC-06)
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let preferences = {};
    if (user.preferences) {
      try {
        preferences = typeof user.preferences === 'string' 
          ? JSON.parse(user.preferences) 
          : user.preferences;
      } catch (_) {
        // Si hay error al parsear, usar preferencias por defecto
        preferences = {
          language: 'es',
          theme: 'light',
          explicitContent: false,
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          timezone: 'America/Mexico_City',
        };
      }
    } else {
      // Preferencias por defecto si no existen
      preferences = {
        language: 'es',
        theme: 'light',
        explicitContent: false,
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        timezone: 'America/Mexico_City',
      };
    }

    res.json({ preferences });
  } catch (err) {
    console.error('Error al obtener preferencias:', err);
    res.status(500).json({ 
      error: 'Error al obtener las preferencias',
      message: err.message 
    });
  }
};

// Get Plan (ACC-07)
exports.getPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Calcular días restantes si hay fecha de fin
    let daysRemaining = null;
    if (user.planEndDate) {
      const now = new Date();
      const endDate = new Date(user.planEndDate);
      const diffTime = endDate - now;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) daysRemaining = 0;
    }

    res.json({ 
      plan: user.plan || 'free',
      planStartDate: user.planStartDate,
      planEndDate: user.planEndDate,
      planStatus: user.planStatus || 'active',
      daysRemaining: daysRemaining
    });
  } catch (err) {
    console.error('Error al obtener plan:', err);
    res.status(500).json({ 
      error: 'Error al obtener el plan',
      message: err.message 
    });
  }
};

// Update Plan (ACC-07) - Mejorar, cambiar o cancelar plan
exports.updatePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { plan, action } = req.body;

    // Validar planes disponibles
    const validPlans = ['free', 'premium', 'family', 'student'];
    if (plan && !validPlans.includes(plan)) {
      return res.status(400).json({ 
        error: 'Plan no válido',
        message: `El plan debe ser uno de: ${validPlans.join(', ')}`,
        field: 'plan'
      });
    }

    // Validar acciones
    const validActions = ['upgrade', 'downgrade', 'cancel', 'change'];
    if (action && !validActions.includes(action)) {
      return res.status(400).json({ 
        error: 'Acción no válida',
        message: `La acción debe ser una de: ${validActions.join(', ')}`,
        field: 'action'
      });
    }

    // Procesar según la acción
    if (action === 'cancel') {
      // Cancelar plan (cambiar a free al finalizar el período actual)
      user.planStatus = 'cancelled';
      await user.save();
      // El plan seguirá activo hasta la fecha de fin
      res.json({ 
        message: 'Plan cancelado exitosamente. Tu plan actual permanecerá activo hasta la fecha de finalización.',
        plan: user.plan,
        planStatus: user.planStatus,
        planEndDate: user.planEndDate,
        note: 'Tu plan se cancelará al finalizar el período actual'
      });
    } else if (action === 'upgrade' || action === 'change') {
      // Mejorar o cambiar plan
      if (!plan) {
        return res.status(400).json({ 
          error: 'Plan requerido',
          message: 'Debes especificar el plan al que deseas cambiar',
          field: 'plan'
        });
      }

      const currentPlan = user.plan || 'free';
      const planHierarchy = { free: 0, student: 1, premium: 2, family: 3 };
      
      // Verificar si es una mejora válida
      if (action === 'upgrade' && planHierarchy[plan] <= planHierarchy[currentPlan]) {
        return res.status(400).json({ 
          error: 'No es una mejora válida',
          message: `El plan ${plan} no es una mejora sobre tu plan actual ${currentPlan}`,
          field: 'plan'
        });
      }

      // Actualizar plan
      user.plan = plan;
      user.planStatus = 'active';
      user.planStartDate = new Date();
      
      // Calcular fecha de fin (1 año por defecto)
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      user.planEndDate = endDate;

      await user.save();

      res.json({ 
        message: action === 'upgrade' ? 'Plan mejorado exitosamente' : 'Plan cambiado exitosamente',
        plan: user.plan,
        planStartDate: user.planStartDate,
        planEndDate: user.planEndDate,
        planStatus: user.planStatus
      });
    } else if (plan) {
      // Si solo se proporciona el plan sin acción, actualizar directamente
      user.plan = plan;
      user.planStatus = req.body.planStatus || 'active';
      if (req.body.planStartDate) {
        user.planStartDate = new Date(req.body.planStartDate);
      }
      if (req.body.planEndDate) {
        user.planEndDate = new Date(req.body.planEndDate);
      }
      
      await user.save();

      res.json({ 
        message: 'Plan actualizado exitosamente',
        plan: user.plan,
        planStartDate: user.planStartDate,
        planEndDate: user.planEndDate,
        planStatus: user.planStatus
      });
    } else {
      return res.status(400).json({ 
        error: 'Datos insuficientes',
        message: 'Debes proporcionar un plan o una acción válida'
      });
    }
  } catch (err) {
    console.error('Error al actualizar plan:', err);
    res.status(500).json({ 
      error: 'Error al actualizar el plan',
      message: err.message 
    });
  }
};
