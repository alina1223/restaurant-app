const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const User = require('../models/User');

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      
      const user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'name', 'email', 'role', 'department', 'isEmailVerified']
      });
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      req.user = user;
      req.headers['role'] = user.role;
      req.headers['currentuserid'] = user.id.toString();
      
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Token invalid or expired' });
    }
  } else {
    const roleHeader = req.headers['role'];
    
    if (roleHeader) {
      next();
    } else {
      return res.status(401).json({ message: 'Authorization header required' });
    }
  }
};

module.exports = function(role) {
  return [authenticateJWT, (req, res, next) => {
    const userRole = req.user ? req.user.role : req.headers['role'];
    
    if (!userRole) {
      return res.status(401).json({ message: 'Rolul nu a fost specificat' });
    }
    
    if (role && userRole !== role) {
      return res.status(403).json({ message: 'Acces interzis' });
    }
    
    next();
  }];
};

module.exports.authenticateJWT = authenticateJWT;