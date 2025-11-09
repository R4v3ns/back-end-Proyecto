'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true, // Permite registro con teléfono solo
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // Información de perfil
      firstName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dateOfBirth: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Preferencias de cuenta (JSON se almacena como TEXT en SQLite)
      preferences: {
        type: Sequelize.TEXT,
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
      },
      // Gestión de plan (ENUM se almacena como TEXT en SQLite)
      plan: {
        type: Sequelize.STRING,
        defaultValue: 'free',
        allowNull: false,
      },
      planStartDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      planEndDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      planStatus: {
        type: Sequelize.STRING,
        defaultValue: 'active',
        allowNull: false,
      },
      // Autenticación y sesión (BOOLEAN se almacena como INTEGER en SQLite)
      isActive: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      isVerified: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      verificationToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      emailVerificationTokenExpires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Tokens para recuperación de contraseña
      resetPasswordToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resetPasswordExpires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Términos y privacidad
      termsAccepted: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      privacyAccepted: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      termsAcceptedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Autenticación de dos factores (2FA)
      twoFactorSecret: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      twoFactorEnabled: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      twoFactorAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      twoFactorAttemptsExpires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Verificación de teléfono
      phoneVerified: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      phoneVerificationToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phoneVerificationTokenExpires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Campos de timestamps
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Agregar índices para mejorar el rendimiento
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_unique'
    });
    
    await queryInterface.addIndex('users', ['plan']);
    await queryInterface.addIndex('users', ['planStatus']);
    await queryInterface.addIndex('users', ['isActive']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
