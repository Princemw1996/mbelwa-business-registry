const pool = require('../config/db');

const AuditLog = {
  create: async (data) => {
    const {
      user_id,
      user_name,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      ip_address,
      user_agent
    } = data;

    const result = await pool.query(
      `INSERT INTO audit_logs (
        user_id, user_name, action, table_name, record_id,
        old_data, new_data, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        user_id || null,
        user_name || null,
        action,
        table_name || null,
        record_id || null,
        old_data || null,
        new_data || null,
        ip_address || null,
        user_agent || null
      ]
    );
    return result.rows[0];
  },

  findAll: async (filters = {}) => {
    let query = `
      SELECT al.*
      FROM audit_logs al
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.user_id) {
      query += ` AND al.user_id = $${paramCount}`;
      values.push(filters.user_id);
      paramCount++;
    }
    if (filters.action) {
      query += ` AND al.action = $${paramCount}`;
      values.push(filters.action);
      paramCount++;
    }
    if (filters.table_name) {
      query += ` AND al.table_name = $${paramCount}`;
      values.push(filters.table_name);
      paramCount++;
    }
    if (filters.from_date) {
      query += ` AND al.created_at >= $${paramCount}`;
      values.push(filters.from_date);
      paramCount++;
    }
    if (filters.to_date) {
      query += ` AND al.created_at <= $${paramCount}`;
      values.push(filters.to_date);
      paramCount++;
    }
    if (filters.search) {
      query += ` AND (al.user_name ILIKE $${paramCount} OR al.action ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ` ORDER BY al.created_at DESC LIMIT 500`;

    const result = await pool.query(query, values);
    return result.rows;
  },

  getStats: async () => {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT user_id) as total_users,
        COUNT(CASE WHEN action = 'CREATE' THEN 1 END) as total_creates,
        COUNT(CASE WHEN action = 'UPDATE' THEN 1 END) as total_updates,
        COUNT(CASE WHEN action = 'DELETE' THEN 1 END) as total_deletes,
        COUNT(CASE WHEN action = 'LOGIN' THEN 1 END) as total_logins
      FROM audit_logs
    `);
    return result.rows[0];
  },

  getUserActivity: async () => {
    const result = await pool.query(`
      SELECT 
        al.user_id,
        al.user_name,
        COUNT(CASE WHEN al.action = 'CREATE' AND al.table_name = 'businesses' THEN 1 END) as businesses_registered,
        COUNT(CASE WHEN al.action = 'UPDATE' AND al.table_name = 'businesses' THEN 1 END) as businesses_updated,
        COUNT(CASE WHEN al.action = 'DELETE' AND al.table_name = 'businesses' THEN 1 END) as businesses_deleted,
        COUNT(*) as total_actions,
        MAX(al.created_at) as last_activity
      FROM audit_logs al
      GROUP BY al.user_id, al.user_name
      ORDER BY businesses_registered DESC
    `);
    return result.rows;
  },

  cleanOldLogs: async (days = 30) => {
    const result = await pool.query(
      'DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL $1 DAYS',
      [days]
    );
    return result.rowCount;
  }
};

module.exports = AuditLog;