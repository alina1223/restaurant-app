const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'abandoned'),
    allowNull: false,
    defaultValue: 'active'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'carts',
  timestamps: true
});

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cartId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'carts',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'cart_items',
  timestamps: true
});

CartItem.addHook('afterFind', (data) => {
  if (!data) return;
  if (Array.isArray(data)) {
    data.forEach(item => {
      item.subtotal = item.quantity * item.price;
    });
  } else {
    data.subtotal = data.quantity * data.price;
  }
});

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cartId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'carts',
      key: 'id'
    }
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  tableName: 'orders',
  timestamps: true
});

Order.generateOrderNumber = function() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

CartItem.afterSave(async (cartItem, options) => {
  const transaction = options?.transaction;

  const cart = await Cart.findByPk(cartItem.cartId, {
    include: [{
      model: CartItem,
      as: 'items'
    }],
    transaction
  });

  if (cart) {
    const total = cart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    await cart.update({ totalAmount: total }, { transaction });
  }
});

CartItem.afterDestroy(async (cartItem, options) => {
  const transaction = options?.transaction;

  const cart = await Cart.findByPk(cartItem.cartId, {
    include: [{
      model: CartItem,
      as: 'items'
    }],
    transaction
  });

  if (cart) {
    const total = cart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    await cart.update({ totalAmount: total }, { transaction });
  }
});

module.exports = { Cart, CartItem, Order };