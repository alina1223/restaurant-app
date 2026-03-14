const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const AuthEmailVerificationService = require('../services/auth-email-verification.service');
const AuthService = require('../services/auth.service');
const { authenticateJWT } = require('../middlewares/auth');
router.post(
  '/register',
  [
    body('name')
      .isString().withMessage('Numele trebuie să fie text')
      .isLength({ min: 3 }).withMessage('Numele trebuie să aibă minim 3 caractere'),
    body('email').isEmail().withMessage('Email invalid').normalizeEmail(),
    body('password')
      .isString().withMessage('Parola trebuie să fie text')
      .isLength({ min: 6 }).withMessage('Parola trebuie să aibă minim 6 caractere'),
    body('phone').matches(/^(\+373|0)\d{7,8}$/).withMessage('Număr de telefon invalid (MD)'),
    body('age').isInt({ min: 18 }).withMessage('Trebuie să aveți cel puțin 18 ani'),
    body('role').isIn(['user', 'admin', 'manager']).withMessage('Rol invalid'),
    body('department')
      .if(body('role').equals('manager'))
      .notEmpty().withMessage('Departamentul este obligatoriu pentru manageri')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array()
      });
    }

    try {
      const result = await AuthEmailVerificationService.register(req.body);

      res.status(201).json({
        message: result.message,
        user: result.user,
        expiresAt: result.expiresAt,
        note: 'Please check your email to verify your account before logging in.'
      });
    } catch (error) {
      const statusCode = error.message.includes('already registered') ? 409 : 400;
      res.status(statusCode).json({
        message: 'Eroare la înregistrare',
        error: error.message
      });
    }
  }
);

router.post(
  '/verify-email',
  [
    body('token').notEmpty().withMessage('Token-ul este obligatoriu').isString().withMessage('Token invalid')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array()
      });
    }

    try {
      const result = await AuthEmailVerificationService.verifyEmail(req.body.token);

      res.json({
        message: result.message,
        user: result.user,
        token: result.token,
        redirectTo: '/dashboard'
      });
    } catch (error) {
      res.status(400).json({
        message: 'Eroare la verificarea email-ului',
        error: error.message,
        suggestion: 'Request a new verification link if this one has expired.'
      });
    }
  }
);

router.post(
  '/resend-verification',
  [body('email').isEmail().withMessage('Email invalid').normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array()
      });
    }

    try {
      console.log(`📧 Resend verification email for: ${req.body.email}`);
      const result = await AuthEmailVerificationService.resendVerificationEmail(req.body.email);

      console.log(`✅ Resend verification result:`, result);

      res.json({
        message: result.message,
        expiresAt: result.expiresAt,
        attempts: result.attempts
      });
    } catch (error) {
      console.error(`❌ Resend verification error:`, error.message);
      res.status(400).json({
        message: 'Eroare la retrimiterea email-ului',
        error: error.message
      });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalid').normalizeEmail(),
    body('password').notEmpty().withMessage('Parola este obligatorie')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array()
      });
    }

    try {
      const result = await AuthEmailVerificationService.login(req.body.email, req.body.password);

      res.json({
        message: result.message,
        user: result.user,
        token: result.token
      });
    } catch (error) {
      const statusCode = error.message.includes('credentials') ? 401 : 403;
      res.status(statusCode).json({
        message: 'Autentificare eșuată',
        error: error.message,
        suggestion: error.message.includes('verify')
          ? 'Check your email or request a new verification link.'
          : null
      });
    }
  }
);

router.post(
  '/forgot-password',
  [body('email').trim().isEmail().withMessage('Email invalid').normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array()
      });
    }

    try {
      const result = await AuthService.sendPasswordResetEmail(req.body.email);
      res.json({
        message: result.message,
        success: true
      });
    } catch (error) {
      res.status(400).json({
        message: 'Eroare la trimiterea email-ului de resetare',
        error: error.message
      });
    }
  }
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token-ul este obligatoriu').isString().withMessage('Token invalid'),
    body('newPassword')
      .isString().withMessage('Parola trebuie să fie text')
      .isLength({ min: 6 }).withMessage('Parola trebuie să aibă minim 6 caractere'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Parolele nu coincid');
        }
        return true;
      })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array()
      });
    }

    try {
      const result = await AuthService.resetPassword(req.body.token, req.body.newPassword);
      res.json({
        message: result.message,
        success: true
      });
    } catch (error) {
      res.status(400).json({
        message: 'Eroare la resetarea parolei',
        error: error.message
      });
    }
  }
);

router.get('/account-status/:email', async (req, res) => {
  try {
    const result = await AuthEmailVerificationService.checkAccountStatus(req.params.email);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: 'Eroare la verificarea statusului',
      error: error.message
    });
  }
});

router.get('/verify-token', authenticateJWT, (req, res) => {
  res.json({
    message: 'Token valid',
    user: req.user
  });
});

router.post('/logout', (req, res) => {
  res.json({
    message: 'Logout successful',
    note: 'Token invalidated on client side.'
  });
});

router.get('/test-verification-link/:token', async (req, res) => {
  try {
    const result = await AuthEmailVerificationService.verifyEmail(req.params.token);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    res.send(`
      <html>
        <head><title>Email Verified</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: green;">✅ Email Verified Successfully!</h1>
          <p>${result.message}</p>
          <p>User: ${result.user.email}</p>
          <p>You can now <a href="${frontendUrl}/auth">login</a> to your account.</p>
          <p><small>Token: ${req.params.token.substring(0, 20)}...</small></p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(400).send(`
      <html>
        <head><title>Verification Failed</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: red;">❌ Verification Failed</h1>
          <p>${error.message}</p>
          <p>Please request a new verification link.</p>
        </body>
      </html>
    `);
  }
});

router.post('/test-email', async (req, res) => {
  try {
    const EmailService = require('../services/email.service');
    const result = await EmailService.sendVerificationEmail('test@example.com', 'Test User', 'test-token-12345');

    res.json({
      message: 'Test email result',
      success: result.success,
      details: result
    });
  } catch (error) {
    res.status(500).json({
      message: 'Test email failed',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;