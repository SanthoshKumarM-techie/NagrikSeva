import { seedDatabase } from './seed_existing.js';

async function main() {
  try {
    console.log('🚀 Running database initialization & seeding for existing tables...');
    await seedDatabase();
    console.log('✨ All master data and demo accounts initialized successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message || err);
    process.exit(1);
  }
}

main();
