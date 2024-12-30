import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.resolve(process.env.DB_PATH || './data/radio.db');

async function migrateStations() {
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
    db.prepare('CREATE TABLE user_stations_backup AS SELECT * FROM user_stations').run();

    // Drop existing table
    console.log('Dropping existing table...');
    db.prepare('DROP TABLE user_stations').run();

    // Create new table
    console.log('Creating new table with user_id...');
    db.prepare(`
      CREATE TABLE user_stations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        logo TEXT,
        listen_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();

    // Create indexes
    console.log('Creating indexes...');
    db.prepare('CREATE INDEX idx_user_stations_user_id ON user_stations(user_id)').run();
    db.prepare('CREATE INDEX idx_user_stations_created_at ON user_stations(created_at DESC)').run();

    // Get first user
    const firstUser = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get();
    
    if (!firstUser) {
      throw new Error('No users found in the database');
    }

    // Migrate data
    console.log(`Migrating stations to user ${firstUser.id}...`);
    db.prepare(`
      INSERT INTO user_stations (id, user_id, name, logo, listen_url, created_at)
      SELECT id, ?, name, logo, listen_url, created_at
      FROM user_stations_backup
    `).run(firstUser.id);

    // Verify migration
    const stationCount = db.prepare('SELECT COUNT(*) as count FROM user_stations').get();
    const backupCount = db.prepare('SELECT COUNT(*) as count FROM user_stations_backup').get();
    
    if (stationCount.count !== backupCount.count) {
      throw new Error(`Migration verification failed: ${stationCount.count} stations in new table vs ${backupCount.count} in backup`);
    }

    // Commit transaction
    db.prepare('COMMIT').run();
    
    console.log('Migration completed successfully!');
    console.log(`Migrated ${stationCount.count} stations to user ${firstUser.id}`);
    console.log('You can now drop the backup table with: DROP TABLE user_stations_backup');

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
migrateStations().catch(console.error);
