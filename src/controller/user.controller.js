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

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({ 
      token, 
      user: formatUserResponse(user) 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logout (handled client-side by deleting token. Optionally support server-side blacklisting)
exports.logout = async (req, res) => {
  // Assumes stateless JWT auth: client deletes token.
  res.json({ message: 'Logged out successfully' });
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // req.user populated by authentication middleware
    const { currentPassword, newPassword, passwordConfirmation } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Validar contraseña actual
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ 
        error: 'La contraseña actual es incorrecta',
        field: 'currentPassword'
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

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Contraseña cambiada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // req.user should be set by auth middleware
    
    // Mapear campos del frontend a los del backend
    const updates = {};
    
    // Manejar username
    if (req.body.username !== undefined) {
      console.log('📝 Username recibido:', req.body.username);
      // Validar que el username no esté vacío si se proporciona
      if (req.body.username && req.body.username.trim()) {
        const trimmedUsername = req.body.username.trim();
        console.log('📝 Verificando unicidad del username:', trimmedUsername);
        
        // Verificar que el username no esté en uso por otro usuario
        const existingUser = await User.findOne({ 
          where: { 
            username: trimmedUsername,
            id: { [require('sequelize').Op.ne]: userId } // Excluir el usuario actual
          } 
        });
        
        if (existingUser) {
          console.log('❌ Username ya está en uso por:', existingUser.id);
          return res.status(409).json({ 
            error: 'El nombre de usuario ya está en uso',
            field: 'username'
          });
        }
        
        updates.username = trimmedUsername;
        console.log('✅ Username válido, se agregará a updates:', trimmedUsername);
      } else {
        console.log('⚠️ Username vacío o null, se establecerá como null');
        updates.username = null;
      }
    } else {
      console.log('ℹ️ Username no está en el body de la petición');
    }
    
    // Manejar firstName y lastName
    // Prioridad: si vienen firstName/lastName directamente, usarlos
    // Si no, pero viene name, dividirlo
    if (req.body.firstName !== undefined || req.body.lastName !== undefined) {
      // Si vienen firstName o lastName directamente, usarlos (tienen prioridad)
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
    
    console.log('📝 firstName/lastName - Request body:', { 
      firstName: req.body.firstName, 
      lastName: req.body.lastName, 
      name: req.body.name 
    });
    console.log('📝 firstName/lastName - Updates:', { 
      firstName: updates.firstName, 
      lastName: updates.lastName 
    });
    
    // Mapear biography -> bio
    if (req.body.biography !== undefined) {
      updates.bio = req.body.biography;
    }
    if (req.body.bio !== undefined) {
      updates.bio = req.body.bio;
    }
    
    // Mapear birthDate -> dateOfBirth
    if (req.body.birthDate !== undefined) {
      updates.dateOfBirth = req.body.birthDate;
    }
    if (req.body.dateOfBirth !== undefined) {
      updates.dateOfBirth = req.body.dateOfBirth;
    }
    
    // Mapear profileImage -> avatar
    if (req.body.profileImage !== undefined) {
      updates.avatar = req.body.profileImage;
    }
    if (req.body.avatar !== undefined) {
      updates.avatar = req.body.avatar;
    }
    
    // Campos directos
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    
    // Log para debugging
    console.log('📝 Update Profile - User ID:', userId);
    console.log('📝 Update Profile - Request body:', { ...req.body, password: req.body.password ? '***' : undefined });
    console.log('📝 Update Profile - Updates to apply:', updates);
    
    // SQLite no soporta 'returning: true', así que actualizamos y luego buscamos
    const [affectedRows] = await User.update(updates, {
      where: { id: userId }
    });
    
    console.log('📝 Update Profile - Affected rows:', affectedRows);

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
    res.status(500).json({ error: err.message });
  }
};

// Update Preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    let preferences = {};
    if (user.preferences) {
      try {
        preferences = typeof user.preferences === 'string' 
          ? JSON.parse(user.preferences) 
          : user.preferences;
      } catch (_) {
        preferences = {};
      }
    }
    preferences = { ...preferences, ...req.body };

    user.preferences = preferences;
    await user.save();

    res.json({ 
      message: 'Preferencias actualizadas exitosamente',
      preferences: user.preferences 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Preferences
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    let preferences = {};
    if (user.preferences) {
      try {
        preferences = typeof user.preferences === 'string' 
          ? JSON.parse(user.preferences) 
          : user.preferences;
      } catch (_) {
        preferences = {};
      }
    }

    res.json({ preferences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manage Plan fields: subscribe, cancel, get plan (optional, mock; expand as needed)
exports.getPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ 
      plan: user.plan || null,
      planStartDate: user.planStartDate,
      planEndDate: user.planEndDate,
      planStatus: user.planStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (req.body.plan) {
      user.plan = req.body.plan;
    }
    if (req.body.planStatus) {
      user.planStatus = req.body.planStatus;
    }
    if (req.body.planStartDate) {
      user.planStartDate = req.body.planStartDate;
    }
    if (req.body.planEndDate) {
      user.planEndDate = req.body.planEndDate;
    }
    
    await user.save();

    res.json({ 
      message: 'Plan actualizado exitosamente',
      plan: user.plan,
      planStartDate: user.planStartDate,
      planEndDate: user.planEndDate,
      planStatus: user.planStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
