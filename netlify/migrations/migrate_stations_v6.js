import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.resolve(process.env.DB_PATH || './data/radio.db');

async function migrateStationsV6() {
  // Backup the database file first
  const backupPath = `${dbPath}.backup-${Date.now()}`;
  fs.copyFileSync(dbPath, backupPath);
  console.log(`Database backed up to: ${backupPath}`);

  const db = new Database(dbPath);

  try {
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();

    // Create backup table
    console.log('Creating backup table...');
    db.prepare('CREATE TABLE users_backup AS SELECT * FROM users').run();

    // Drop existing table
    console.log('Dropping existing table...');
    db.prepare('DROP TABLE users').run();

    // Create new table
    console.log('Creating new table with delete_me...');
    db.prepare(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        access_level INTEGER NOT NULL DEFAULT 0,
        delete_me INTEGER NOT NULL DEFAULT 0
      )
    `).run();


    // Verify migration
    const stationCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const backupCount = db.prepare('SELECT COUNT(*) as count FROM users_backup').get();
    
    if (stationCount.count !== backupCount.count) {
      throw new Error(`Migration verification failed: ${stationCount.count} users in new table vs ${backupCount.count} in backup`);
    }
    console.log('Now dropping table users_backup');
    db.prepare('DROP TABLE IF EXISTS users_backup').run(); 

    // Commit transaction
    db.prepare('COMMIT').run();
    
    console.log('Migration completed successfully!');
    console.log(`Migrated ${stationCount.count} users`);

  } catch (error) {
    // Rollback on error
    db.prepare('ROLLBACK').run();
    console.error('Migration failed:', error);
    console.log('Restoring from backup...');
    
    // Close db connection before restore
    db.close();
    
    // Restore from backup
    fs.copyFileSync(backupPath, dbPath);
    console.log('Database restored from backup');
    process.exit(1);
  }

  // Close database connection
  db.close();
}

// Run migration
migrateStationsV6().catch(console.error);
