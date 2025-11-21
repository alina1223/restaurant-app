const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImportExportLog = sequelize.define('ImportExportLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('import', 'export'),
    allowNull: false
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: true // ✅ Schimbă în true dacă vrei opțional
  },
  recordsProcessed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0 // ✅ Adaugă default value
  },
  recordsSuccessful: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  recordsFailed: {
    type: DataTypes.INTEGER,
    allowNull: false, 
    defaultValue: 0
  },
  filters: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'import_export_logs',
  timestamps: true
});

module.exports = ImportExportLog;