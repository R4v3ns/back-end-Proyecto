'use strict';

const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  class User extends require('sequelize').Model {}

  User.init(
    {
      id: {
        type: DataTypes.STRING(36),
        defaultValue: () => crypto.randomUUID(),
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true, // Permite registro con teléfono solo
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // Información de perfil
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Preferencias de cuenta (JSON se almacena como TEXT en SQLite)
      preferences: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: JSON.stringify({
          language: 'es',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          theme: 'light',
          timezone: 'America/Mexico_City',
        }),
        get() {
          const value = this.getDataValue('preferences');
          return value ? JSON.parse(value) : null;
        },
        set(value) {
          this.setDataValue('preferences', value ? JSON.stringify(value) : null);
        },
      },
      // Gestión de plan (ENUM se almacena como STRING en SQLite)
      plan: {
        type: DataTypes.STRING,
        defaultValue: 'free',
        allowNull: false,
      },
      planStartDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      planEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      planStatus: {
        type: DataTypes.STRING,
        defaultValue: 'active',
        allowNull: false,
      },
      // Autenticación y sesión
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      emailVerificationTokenExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Tokens para recuperación de contraseña
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Términos y privacidad
      termsAccepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      privacyAccepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      termsAcceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Autenticación de dos factores (2FA)
      twoFactorSecret: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      twoFactorAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      twoFactorAttemptsExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Verificación de teléfono
      phoneVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      phoneVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phoneVerificationTokenExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
    }
  );

  return User;
};
