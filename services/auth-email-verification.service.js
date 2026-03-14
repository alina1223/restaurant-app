const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const jwtConfig = require('../config/jwt.config');
const User = require('../models/User');
const EmailService = require('./email.service');

class AuthEmailVerificationService {
  static async register(userData) {
    try {
      const existingUser = await User.findOne({ 
        where: { 
          email: userData.email,
          status: { [Op.ne]: 'deleted' }
        }
      });
      
      if (existingUser) {
        if (existingUser.status === 'pending') {
          const emailResult = await AuthEmailVerificationService.sendVerificationEmail(existingUser);
          
          if (!emailResult.success) {
            throw new Error(`Failed to resend verification email: ${emailResult.error}`);
          }
          
          return {
            success: true,
            message: 'Email already registered but not verified. We have sent a new verification link to your email.',
            user: {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              status: existingUser.status,
              isEmailVerified: existingUser.isEmailVerified
            },
            verificationToken: existingUser.emailVerificationToken,
            expiresAt: existingUser.emailVerificationExpires,
            resent: true
          };
        }
        throw new Error('Email already registered');
      }

      const user = await User.create({
        ...userData,
        status: 'pending'
      });
      
      const emailResult = await AuthEmailVerificationService.sendVerificationEmail(user);
      
      if (!emailResult.success) {
        await user.destroy();
        throw new Error(`Failed to send verification email: ${emailResult.error}`);
      }
      
      return {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          isEmailVerified: user.isEmailVerified
        },
        verificationToken: user.emailVerificationToken,
        expiresAt: user.emailVerificationExpires
      };
      
    } catch (error) {
      throw error;
    }
  }

  static async sendVerificationEmail(emailOrUser) {
    try {
      let user = typeof emailOrUser === 'string' 
        ? await User.findOne({ where: { email: emailOrUser } })
        : emailOrUser;
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.isEmailVerified && user.status === 'active') {
        return { 
          success: true, 
          message: 'Email already verified' 
        };
      }
      
      const hoursSinceLastSend = user.emailVerificationSentAt 
        ? (new Date() - new Date(user.emailVerificationSentAt)) / (1000 * 60 * 60)
        : 24;
      
      if (user.emailVerificationAttempts >= 3 && hoursSinceLastSend < 24) {
        throw new Error('Too many verification attempts. Please try again tomorrow.');
      }
      
      console.log(`🔐 Generating verification token for ${user.email}`);
      const verificationToken = user.generateEmailVerificationToken();
      console.log(`✅ Token generated: ${verificationToken.substring(0, 20)}...`);
      await user.save();
      
      console.log(`📧 Sending verification email to ${user.email}`);
      const emailResult = await EmailService.sendVerificationEmail(
        user.email, 
        user.name, 
        verificationToken
      );
      
      console.log(`📨 Email result:`, emailResult);
      
      if (!emailResult.success) {
        throw new Error(`Failed to send email: ${emailResult.error}`);
      }
      
      return { 
        success: true, 
        message: 'Verification email sent successfully',
        token: verificationToken,
        expiresAt: user.emailVerificationExpires,
        attempts: user.emailVerificationAttempts
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
      
      const authToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          isEmailVerified: true
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );
      
      EmailService.sendWelcomeEmail(user.email, user.name, authToken)
        .then(result => {
          if (result.success) {
            console.log(`✅ Welcome email sent to ${user.email}`);
          }
        })
        .catch(console.error);
      
      return {
        success: true,
        message: 'Email verified successfully! Your account is now active.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          isEmailVerified: user.isEmailVerified
        },
        token: authToken
      };
      
    } catch (error) {
      throw error;
    }
  }

  static async resendVerificationEmail(email) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return { 
          success: true, 
          message: 'If an account exists with this email, a verification link has been sent.' 
        };
      }
      
      if (user.isEmailVerified && user.status === 'active') {
        return { 
          success: true, 
          message: 'Email already verified. You can login directly.' 
        };
      }
      
      return await AuthEmailVerificationService.sendVerificationEmail(email);
      
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
      
      if (user.status !== 'active') {
        if (user.status === 'pending') {
          throw new Error('Please verify your email first. Check your inbox or request a new verification link.');
        } else if (user.status === 'suspended') {
          throw new Error('Account suspended. Please contact support.');
        } else {
          throw new Error('Account not active. Please contact support.');
        }
      }
      
      await user.update({ lastLogin: new Date() });
      
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );
      
      return {
        success: true,
        message: 'Login successful',
        user: user.getSafeData(),
        token
      };
      
    } catch (error) {
      throw error;
    }
  }

  static async checkAccountStatus(email) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return { 
          success: false, 
          message: 'Account not found',
          status: 'not_found'
        };
      }
      
      return {
        success: true,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastVerificationSent: user.emailVerificationSentAt,
        verificationAttempts: user.emailVerificationAttempts
      };
      
    } catch (error) {
      throw error;
    }
  }

  static async cleanupPendingAccounts(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const deletedCount = await User.destroy({
        where: {
          status: 'pending',
          isEmailVerified: false,
          createdAt: { [Op.lt]: cutoffDate }
        }
      });
      
      return {
        success: true,
        message: `Cleaned up ${deletedCount} pending accounts older than ${daysOld} days`,
        deletedCount
      };
      
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AuthEmailVerificationService;