const pool = require('../config/db');

const Ward = {
  // Get all wards
  findAll: async () => {
    const result = await pool.query('SELECT * FROM wards ORDER BY name');
    return result.rows;
  },

  // Find ward by ID
  findById: async (id) => {
    const result = await pool.query('SELECT * FROM wards WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Add new ward (admin only)
  create: async (name) => {
    const result = await pool.query(
      'INSERT INTO wards (name) VALUES ($1) RETURNING *',
      [name]
    );
    return result.rows[0];
  },

  // Update ward (admin only)
  update: async (id, name) => {
    const result = await pool.query(
      'UPDATE wards SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0];
  },

  // Delete ward (admin only - careful!)
  delete: async (id) => {
    const result = await pool.query('DELETE FROM wards WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

module.exports = Ward;