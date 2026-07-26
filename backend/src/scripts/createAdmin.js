require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@mbelwa.gov';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, name, email, role`,
      ['System Admin', email, hashed, 'admin']
    );

    if (result.rows.length > 0) {
      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log('   Role: admin');
    } else {
      console.log('ℹ️ Admin user already exists.');
      const existing = await pool.query('SELECT email, role FROM users WHERE email = $1', [email]);
      console.log(`   Existing user: ${existing.rows[0].email} (${existing.rows[0].role})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();