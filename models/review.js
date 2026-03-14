const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE' },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('pending','approved','rejected'), allowNull: false, defaultValue: 'pending' },
  isVerifiedPurchase: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  helpfulCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'reviews',
  timestamps: true
});

Review.getProductStats = async function(productId) {
  const stats = await Review.findAll({
    where: { productId, status: 'approved' },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN rating = 5 THEN 1 ELSE 0 END")), 'fiveStar'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN rating = 4 THEN 1 ELSE 0 END")), 'fourStar'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN rating = 3 THEN 1 ELSE 0 END")), 'threeStar'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN rating = 2 THEN 1 ELSE 0 END")), 'twoStar'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN rating = 1 THEN 1 ELSE 0 END")), 'oneStar']
    ],
    raw: true
  });

  return stats[0] || { averageRating: 0, totalReviews: 0, fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 };
};

Review.getUserStats = async function(userId) {
  const stats = await Review.findAll({
    where: { userId },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'approved' THEN 1 ELSE 0 END")), 'approvedReviews'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pendingReviews']
    ],
    raw: true
  });

  return stats[0] || { totalReviews: 0, averageRating: 0, approvedReviews: 0, pendingReviews: 0 };
};

module.exports = Review;