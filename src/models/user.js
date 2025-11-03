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
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [6, 255],
        },
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
        validate: {
          isIn: [['free', 'basic', 'premium', 'enterprise']],
        },
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
        validate: {
          isIn: [['active', 'expired', 'cancelled']],
        },
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
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      // Hooks de hash y otra lógica de modelo se pueden poner aquí si necesario
    }
  );

  return User;
};
