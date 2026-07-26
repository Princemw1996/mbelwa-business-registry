const pool = require('../config/db');
const bcrypt = require('bcrypt');

const User = {
  // Create a new user (with ward assignment)
  create: async (name, email, password, role = 'viewer', ward_id = null) => {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, ward_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, ward_id, created_at`,
      [name, email, hashed, role, ward_id]
    );
    return result.rows[0];
  },

  // Find user by email (includes ward info)
  findByEmail: async (email) => {
    const result = await pool.query(
      `SELECT u.*, w.name as ward_name
       FROM users u
       LEFT JOIN wards w ON u.ward_id = w.id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.ward_id, w.name as ward_name, u.created_at
       FROM users u
       LEFT JOIN wards w ON u.ward_id = w.id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Compare password
  comparePassword: async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  // Get all users with ward info (for admin)
  findAll: async () => {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.ward_id, w.name as ward_name, u.created_at
       FROM users u
       LEFT JOIN wards w ON u.ward_id = w.id
       ORDER BY u.created_at DESC`
    );
    return result.rows;
  },

  // Update user (admin only) – password optional
  update: async (id, { name, email, role, ward_id, password }) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (email !== undefined) {
      fields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    if (role !== undefined) {
      fields.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }
    if (ward_id !== undefined) {
      fields.push(`ward_id = $${paramCount}`);
      values.push(ward_id);
      paramCount++;
    }
    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);
      fields.push(`password_hash = $${paramCount}`);
      values.push(hashed);
      paramCount++;
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, ward_id
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Delete user (admin only)
  delete: async (id) => {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
};

module.exports = User;