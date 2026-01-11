const express = require('express');
const router = express.Router();
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Setup endpoint - run once to create inventory tables
router.post('/inventory', async (req, res) => {
  const connection = await db.getConnection();

  try {
    // Read SQL file
    const sqlFilePath = path.join(__dirname, '..', '..', 'database', 'create_inventory_system.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    const results = [];

    for (const statement of statements) {
      try {
        if (statement.toLowerCase().includes('create table')) {
          await connection.query(statement);
          const match = statement.match(/create table (?:if not exists )?`?(\w+)`?/i);
          if (match) {
            results.push(`✅ Table '${match[1]}' created`);
          }
        }
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          const match = statement.match(/create table (?:if not exists )?`?(\w+)`?/i);
          if (match) {
            results.push(`⚠️  Table '${match[1]}' already exists`);
          }
        } else {
          results.push(`❌ Error: ${error.message}`);
        }
      }
    }

    res.json({
      success: true,
      message: 'Inventory system setup complete',
      results: results
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
