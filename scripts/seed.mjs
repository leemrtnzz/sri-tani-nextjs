import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function seed() {
  const connectionUri =
    process.env.DATABASE_URL_UTAMA ||
    process.env.DATABASE_URL ||
    'mysql://root@127.0.0.1:3306/db_sri_tani';

  const connection = await mysql.createConnection(connectionUri);

  console.log('Seeding database at:', connectionUri);

  // Check if admin user exists
  const [existing] = await connection.query(
    'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
    ['admin', 'admin@sritani.com']
  );

  if (Array.isArray(existing) && existing.length === 0) {
    const passwordHash = await bcrypt.hash('password123', 10);
    await connection.query(
      'INSERT INTO users (nama, email, username, password, role) VALUES (?, ?, ?, ?, ?)',
      ['Administrator', 'admin@sritani.com', 'admin', passwordHash, 'admin']
    );
    console.log('Admin user seeded: admin / password123');
  } else {
    console.log('Admin user already exists.');
  }

  await connection.end();
  console.log('Seeding finished.');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
