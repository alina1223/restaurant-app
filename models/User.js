const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'name',
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      name: 'Users_email_key',
      msg: 'Email already exists'
    },
    field: 'email',
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password',
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'phone',
    validate: {
      is: /^(\+373|0)\d{7,8}$/
    }
  },
  
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'age',
    validate: {
      min: 18,
      max: 120
    }
  },

  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'user',
    field: 'role',
    validate: {
      isIn: [['user', 'admin', 'manager']]
    }
  },
  
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'department',
    validate: {
      len: [0, 100]
    }
  },

  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    field: 'status',
    validate: {
      isIn: [['pending', 'active', 'suspended', 'deleted']]
    }
  },

  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    field: 'isemailverified',
    allowNull: false,
    defaultValue: false
  },
  
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    field: 'emailverificationtoken',
    allowNull: true
  },
  
  emailVerificationExpires: {
    type: DataTypes.DATE,
    field: 'emailverificationexpires',
    allowNull: true
  },
  
  emailVerificationSentAt: {
    type: DataTypes.DATE,
    field: 'emailverificationsentat',
    allowNull: true
  },
  
  emailVerificationAttempts: {
    type: DataTypes.INTEGER,
    field: 'emailverificationattempts',
    allowNull: false,
    defaultValue: 0
  },

  passwordResetToken: {
    type: DataTypes.STRING(255),
    field: 'passwordresettoken',
    allowNull: true
  },
  
  passwordResetExpires: {
    type: DataTypes.DATE,
    field: 'passwordresetexpires',
    allowNull: true
  },

  lastLogin: {
    type: DataTypes.DATE,
    field: 'lastlogin',
    allowNull: true
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    field: 'isactive',
    allowNull: false,
    defaultValue: true
  },
  
  profileImage: {
    type: DataTypes.STRING(500),
    field: 'profileimage',
    allowNull: true
  }

}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  underscored: false,
  freezeTableName: true,

  hooks: {
    beforeCreate: async (user) => {
      try {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }

        user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.emailVerificationSentAt = new Date();
        user.status = 'pending';

      } catch (error) {
        console.error('Error in beforeCreate hook:', error);
        throw error;
      }
    },
    
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  },

  defaultScope: {
    attributes: { 
      exclude: [
        'password', 
        'emailVerificationToken', 
        'emailVerificationExpires',
        'passwordResetToken', 
        'passwordResetExpires'
      ] 
    },
    where: { 
      status: 'active',
      isActive: true 
    }
  },

  scopes: {
    withSensitiveData: {
      attributes: { include: [] }
    },

    withPassword: {
      attributes: { include: ['password'] }
    },

    pending: {
      where: { status: 'pending' }
    },

    active: {
      where: { status: 'active' }
    },

    suspended: {
      where: { status: 'suspended' }
    },

    verified: {
      where: { isEmailVerified: true }
    },

    unverified: {
      where: { isEmailVerified: false }
    },

    admins: {
      where: { role: 'admin' }
    },

    managers: {
      where: { role: 'manager' }
    },

    users: {
      where: { role: 'user' }
    }
  }
});

User.prototype.verifyPassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

User.prototype.generateEmailVerificationToken = function() {
  this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  this.emailVerificationSentAt = new Date();
  this.emailVerificationAttempts += 1;
  return this.emailVerificationToken;
};

User.prototype.generatePasswordResetToken = function() {
  this.passwordResetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  return this.passwordResetToken;
};

User.prototype.isEmailVerificationTokenValid = function() {
  return this.emailVerificationToken && 
         this.emailVerificationExpires && 
         new Date(this.emailVerificationExpires) > new Date();
};

User.prototype.markEmailAsVerified = async function() {
  this.isEmailVerified = true;
  this.status = 'active';
  this.emailVerificationToken = null;
  this.emailVerificationExpires = null;
  return await this.save();
};

User.prototype.getSafeData = function() {
  const userData = this.toJSON();
  const { 
    password, 
    emailVerificationToken, 
    emailVerificationExpires,
    passwordResetToken, 
    passwordResetExpires,
    ...safeData 
  } = userData;
  
  return safeData;
};

User.prototype.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save({ fields: ['lastLogin'] });
};

User.prototype.hasRole = function(role) {
  return this.role === role;
};

User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

User.prototype.isManager = function() {
  return this.role === 'manager';
};

User.findByEmail = async function(email, options = {}) {
  return await User.scope('withPassword').findOne({
    where: { email: email.toLowerCase().trim() },
    ...options
  });
};

User.findByEmailVerificationToken = async function(token) {
  return await User.scope('withSensitiveData').findOne({
    where: { 
      emailVerificationToken: token,
      emailVerificationExpires: { [Op.gt]: new Date() }
    }
  });
};

User.findByPasswordResetToken = async function(token) {
  return await User.scope('withSensitiveData').findOne({
    where: { 
      passwordResetToken: token,
      passwordResetExpires: { [Op.gt]: new Date() }
    }
  });
};

User.createWithValidation = async function(userData) {
  if (userData.role === 'manager' && !userData.department) {
    throw new Error('Departamentul este obligatoriu pentru manageri');
  }
  
  return await User.create(userData);
};

User.getStatistics = async function() {
  const stats = await User.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalUsers'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'active' THEN 1 ELSE 0 END")), 'activeUsers'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pendingUsers'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN isemailverified = true THEN 1 ELSE 0 END")), 'verifiedUsers'],
      [sequelize.fn('COUNT', sequelize.literal('DISTINCT role')), 'uniqueRoles']
    ],
    raw: true
  });
  
  return stats[0] || {
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    verifiedUsers: 0,
    uniqueRoles: 0
  };
};

module.exports = User;