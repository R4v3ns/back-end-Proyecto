'use strict';

const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
 
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
          len: [6, 255], // Mínimo 6 caracteres
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
      // Preferencias de cuenta
      preferences: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          language: 'es',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          theme: 'light',
          timezone: 'America/Mexico_City',
        },
      },
      // Gestión de plan
      plan: {
        type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
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
        type: DataTypes.ENUM('active', 'expired', 'cancelled'),
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
      hooks: {
        // Hashear contraseña antes de crear
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await User.hashPassword(user.password);
          }
        },
        // Hashear contraseña antes de actualizar (si cambió)
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await User.hashPassword(user.password);
          }
        },
      },
    }
  );

  // Métodos estáticos para operaciones comunes

  // Registrarse (crear nuevo usuario)
  User.register = async function (userData) {
    try {
      const user = await User.create({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        preferences: userData.preferences || {},
      });
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Iniciar sesión (buscar usuario y verificar contraseña)
  User.login = async function (email, password) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (!user.isActive) {
        throw new Error('Cuenta desactivada');
      }

      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        throw new Error('Contraseña incorrecta');
      }

      // Actualizar último inicio de sesión
      await user.update({ lastLogin: new Date() });

      return user;
    } catch (error) {
      throw error;
    }
  };

  // Cambiar contraseña
  User.prototype.changePassword = async function (currentPassword, newPassword) {
    try {
      const isCurrentPasswordValid = await this.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        throw new Error('La contraseña actual es incorrecta');
      }

      this.password = newPassword;
      await this.save();
      
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Configurar perfil
  User.prototype.updateProfile = async function (profileData) {
    try {
      const allowedFields = [
        'firstName',
        'lastName',
        'phone',
        'avatar',
        'bio',
        'dateOfBirth',
      ];

      const updateData = {};
      allowedFields.forEach((field) => {
        if (profileData[field] !== undefined) {
          updateData[field] = profileData[field];
        }
      });

      await this.update(updateData);
      await this.reload();
      
      return this;
    } catch (error) {
      throw error;
    }
  };

  // Actualizar preferencias de cuenta
  User.prototype.updatePreferences = async function (preferencesData) {
    try {
      const currentPreferences = this.preferences || {};
      const updatedPreferences = {
        ...currentPreferences,
        ...preferencesData,
        notifications: {
          ...(currentPreferences.notifications || {}),
          ...(preferencesData.notifications || {}),
        },
      };

      await this.update({ preferences: updatedPreferences });
      await this.reload();
      
      return this;
    } catch (error) {
      throw error;
    }
  };

  // Gestionar plan
  User.prototype.updatePlan = async function (planData) {
    try {
      const updateData = {};
      
      if (planData.plan) {
        updateData.plan = planData.plan;
      }
      
      if (planData.planStartDate) {
        updateData.planStartDate = planData.planStartDate;
      }
      
      if (planData.planEndDate) {
        updateData.planEndDate = planData.planEndDate;
      }
      
      if (planData.planStatus) {
        updateData.planStatus = planData.planStatus;
      }

      await this.update(updateData);
      await this.reload();
      
      return this;
    } catch (error) {
      throw error;
    }
  };

  return User;
};
