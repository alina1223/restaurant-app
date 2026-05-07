const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const User = require('../models/User');
const EmailService = require('./email.service');
const crypto = require('crypto');

class AuthService {
  static async register(userData) {
    try {
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const user = await User.create(userData);
      
      const token = AuthService.generateToken(user);
      
      AuthService.sendWelcomeEmailAsync(user.email, user.name, token);
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          age: user.age,
          role: user.role,
          department: user.department,
          isEmailVerified: user.isEmailVerified
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  static async login(email, password) {
    try {
      const user = await User.scope('withPassword').findOne({ where: { email } });
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await user.verifyPassword(password);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      await user.updateLastLogin();
      
      const token = AuthService.generateToken(user);
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          age: user.age,
          role: user.role,
          department: user.department,
          isEmailVerified: user.isEmailVerified
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  static generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    };

    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      algorithm: jwtConfig.algorithm
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async sendWelcomeEmailAsync(email, name, token) {
    try {
      const result = await EmailService.sendWelcomeEmail(email, name, token);
      if (!result.success) {
        console.warn('⚠️ Avertisment: Email-ul de bun venit nu a putut fi trimis:', result.error);
      }
    } catch (error) {
      console.error('❌ Eroare la trimiterea emailului de bun venit:', error.message);
    }
  }

  static async sendVerificationEmail(email) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.isEmailVerified) {
        throw new Error('Email already verified');
      }
      
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();
      
      const result = await EmailService.sendVerificationEmail(
        user.email, 
        user.name, 
        verificationToken
      );
      
      if (!result.success) {
        throw new Error(`Failed to send email: ${result.error}`);
      }
      
      return { 
        success: true, 
        message: 'Verification email sent successfully',
        token: verificationToken
      };
    } catch (error) {
      throw error;
    }
  }

  static async verifyEmail(token) {
    try {
      const user = await User.findByEmailVerificationToken(token);
      
      if (!user) {
        throw new Error('Invalid or expired verification token');
      }
      
      await user.markEmailAsVerified();
      
      return { 
        success: true, 
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isEmailVerified: user.isEmailVerified
        }
      };
    } catch (error) {
      throw error;
    }
  }

  static async sendPasswordResetEmail(email) {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const user = await User.findOne({ where: { email: normalizedEmail } });
      
      if (!user) {
        return { 
          success: true, 
          message: 'If the email exists, a reset link will be sent' 
        };
      }
      
      let resetToken;
      if (typeof user.generatePasswordResetToken === 'function') {
        resetToken = user.generatePasswordResetToken();
      } else {
        resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      }

      await user.save();
      
      EmailService.sendPasswordResetEmail(user.email, user.name, resetToken)
        .then(result => {
          if (result.success) {
            console.log(`✅ Email resetare parolă trimis către ${user.email}`);
          } else {
            console.warn(`⚠️ Email resetare parolă eșuat pentru ${user.email}:`, result.error);
          }
        })
        .catch(error => {
          console.error(`❌ Eroare la trimiterea emailului de resetare:`, error.message);
        });
      
      return { 
        success: true, 
        message: 'Password reset email sent if account exists',
        token: resetToken
      };
    } catch (error) {
      throw error;
    }
  }

  static async resetPassword(token, newPassword) {
    try {
      const user = await User.findByPasswordResetToken(token);
      
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }
      
      user.password = newPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
      
      return { 
        success: true, 
        message: 'Password reset successful'
      };
    } catch (error) {
      throw error;
    }
  }

  static async refreshToken(oldToken) {
    try {
      const decoded = AuthService.verifyToken(oldToken);
      
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const newToken = AuthService.generateToken(user);
      
      return {
        success: true,
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      };
    } catch (error) {
      throw new Error('Cannot refresh token: ' + error.message);
    }
  }

  static async validateToken(token) {
    try {
      const decoded = AuthService.verifyToken(token);
      
      const user = await User.scope('active').findByPk(decoded.userId);
      if (!user) {
        throw new Error('User not found or inactive');
      }
      
      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          isEmailVerified: user.isEmailVerified
        },
        decoded
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.scope('withPassword').findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      user.password = newPassword;
      await user.save();
      
      return { 
        success: true, 
        message: 'Password changed successfully' 
      };
    } catch (error) {
      throw error;
    }
  }

  static async getUserFromToken(token) {
    try {
      const validation = await AuthService.validateToken(token);
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      return {
        success: true,
        user: validation.user
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AuthService;