const pool = require('../config/db');
const AuditLog = require('./AuditLog');

const Business = {
  // Create a new business
  create: async (data, user = null) => {
    const {
      registration_number,
      business_name,
      owner_name,
      owner_phone,
      owner_email,
      business_type,
      category,
      license_fee,
      ward_id,
      physical_address,
      licence_number,
      registration_date,
      expiry_date,
      created_by
    } = data;

    const result = await pool.query(
      `INSERT INTO businesses (
        registration_number, business_name, owner_name, owner_phone,
        owner_email, business_type, category, license_fee, ward_id,
        physical_address, licence_number, registration_date, expiry_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        registration_number || null,
        business_name,
        owner_name,
        owner_phone,
        owner_email,
        business_type,
        category,
        license_fee,
        ward_id,
        physical_address,
        licence_number,
        registration_date,
        expiry_date,
        created_by
      ]
    );
    
    const business = result.rows[0];
    
    if (user && business) {
      try {
        await AuditLog.create({
          user_id: user.id,
          user_name: user.name || 'Unknown User',
          action: 'CREATE',
          table_name: 'businesses',
          record_id: business.id,
          new_data: business,
          ip_address: 'system',
          user_agent: 'system'
        });
      } catch (err) {
        console.error('Audit log error:', err.message);
      }
    }
    
    return business;
  },

  // Find all businesses with filters
  findAll: async (filters = {}) => {
    let query = `
      SELECT b.*, w.name as ward_name, u.name as created_by_name
      FROM businesses b
      LEFT JOIN wards w ON b.ward_id = w.id
      LEFT JOIN users u ON b.created_by = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.ward_id) {
      query += ` AND b.ward_id = $${paramCount}`;
      values.push(filters.ward_id);
      paramCount++;
    }
    if (filters.status) {
      query += ` AND b.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }
    if (filters.search) {
      query += ` AND (b.business_name ILIKE $${paramCount} OR b.owner_name ILIKE $${paramCount} OR b.registration_number ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }
    if (filters.from_date) {
      query += ` AND b.registration_date >= $${paramCount}`;
      values.push(filters.from_date);
      paramCount++;
    }
    if (filters.to_date) {
      query += ` AND b.registration_date <= $${paramCount}`;
      values.push(filters.to_date);
      paramCount++;
    }

    query += ` ORDER BY b.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  },

  // Find business by ID
  findById: async (id) => {
    const result = await pool.query(
      `SELECT b.*, w.name as ward_name, u.name as created_by_name
       FROM businesses b
       LEFT JOIN wards w ON b.ward_id = w.id
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Update business
  update: async (id, data, updated_by, user = null) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'registration_number', 'business_name', 'owner_name', 'owner_phone',
      'owner_email', 'business_type', 'category', 'license_fee', 'ward_id',
      'physical_address', 'licence_number', 'registration_date', 'expiry_date', 'status'
    ];

    const oldDataResult = await pool.query('SELECT * FROM businesses WHERE id = $1', [id]);
    const oldData = oldDataResult.rows[0];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        values.push(data[field]);
        paramCount++;
      }
    }

    if (fields.length === 0) return null;

    values.push(updated_by);
    const query = `
      UPDATE businesses
      SET ${fields.join(', ')}, updated_by = $${paramCount}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;
    values.push(id);

    const result = await pool.query(query, values);
    const business = result.rows[0];
    
    if (business && user) {
      try {
        await AuditLog.create({
          user_id: user.id,
          user_name: user.name || 'Unknown User',
          action: 'UPDATE',
          table_name: 'businesses',
          record_id: business.id,
          old_data: oldData,
          new_data: business,
          ip_address: 'system',
          user_agent: 'system'
        });
      } catch (err) {
        console.error('Audit log error:', err.message);
      }
    }
    
    return business;
  },

  // Soft delete
  delete: async (id, user = null) => {
    const oldDataResult = await pool.query('SELECT * FROM businesses WHERE id = $1', [id]);
    const oldData = oldDataResult.rows[0];
    
    const result = await pool.query(
      `UPDATE businesses SET status = 'closed'
       WHERE id = $1 RETURNING *`,
      [id]
    );
    const business = result.rows[0];
    
    if (business && user) {
      try {
        await AuditLog.create({
          user_id: user.id,
          user_name: user.name || 'Unknown User',
          action: 'DELETE',
          table_name: 'businesses',
          record_id: business.id,
          old_data: oldData,
          new_data: business,
          ip_address: 'system',
          user_agent: 'system'
        });
      } catch (err) {
        console.error('Audit log error:', err.message);
      }
    }
    
    return business;
  },

  // Count businesses per ward
  countPerWard: async () => {
    const result = await pool.query(
      `SELECT w.id, w.name, COUNT(b.id) as total
       FROM wards w
       LEFT JOIN businesses b ON w.id = b.ward_id AND b.status != 'closed'
       GROUP BY w.id, w.name
       ORDER BY w.name`
    );
    return result.rows;
  },

  // Monthly registration count
  countPerMonth: async (year) => {
    const result = await pool.query(
      `SELECT TO_CHAR(registration_date, 'Month') as month,
              COUNT(*) as total
       FROM businesses
       WHERE EXTRACT(YEAR FROM registration_date) = $1
       GROUP BY month
       ORDER BY MIN(registration_date)`,
      [year]
    );
    return result.rows;
  },

  // Search owners
  searchOwners: async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }
    const query = `
      SELECT DISTINCT ON (owner_name) 
        owner_name, 
        owner_phone, 
        owner_email
      FROM businesses
      WHERE owner_name ILIKE $1 
         OR owner_phone ILIKE $1 
         OR owner_email ILIKE $1
      ORDER BY owner_name, created_at DESC
      LIMIT 10
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  },

  // ===== NEW: Get businesses grouped by user who registered them =====
  getBusinessesByUser: async () => {
    const query = `
      SELECT 
        u.id as user_id,
        u.name as user_name,
        COUNT(b.id) as total_businesses,
        COALESCE(
          json_agg(
            json_build_object(
              'id', b.id,
              'registration_number', b.registration_number,
              'business_name', b.business_name,
              'owner_name', b.owner_name,
              'category', b.category,
              'license_fee', b.license_fee,
              'ward_id', b.ward_id,
              'ward_name', w.name,
              'status', b.status,
              'registration_date', b.registration_date,
              'created_at', b.created_at
            ) ORDER BY b.created_at DESC
          ) FILTER (WHERE b.id IS NOT NULL),
          '[]'::json
        ) as businesses
      FROM users u
      LEFT JOIN businesses b ON u.id = b.created_by
      LEFT JOIN wards w ON b.ward_id = w.id
      WHERE u.role != 'admin'
      GROUP BY u.id, u.name
      HAVING COUNT(b.id) > 0
      ORDER BY total_businesses DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
};

module.exports = Business;