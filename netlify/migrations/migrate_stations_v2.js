import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.resolve(process.env.DB_PATH || './data/radio.db');

async function migrateStationsV2() {
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

    // Add station_id column
    console.log('Adding station_id column...');
    db.prepare('ALTER TABLE user_stations ADD station_id TEXT').run();

    // Update station_id with id
    console.log('Updating station_id...');
    db.prepare('UPDATE user_stations SET station_id = id').run();

    // Create new table
    console.log('Creating new table...');
    db.prepare(`
      CREATE TABLE IF NOT EXISTS user_stations_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_id TEXT,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        logo TEXT,
        listen_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();

    // Migrate data
    console.log('Migrating data to new table...');
    db.prepare(`
      INSERT INTO user_stations_new (station_id, user_id, name, logo, listen_url, created_at)
      SELECT station_id, user_id, name, logo, listen_url, created_at FROM user_stations
    `).run();

    // Verify migration
    const oldCount = db.prepare('SELECT COUNT(*) as count FROM user_stations').get();
    const newCount = db.prepare('SELECT COUNT(*) as count FROM user_stations_new').get();
    
    if (oldCount.count !== newCount.count) {
      throw new Error(`Migration verification failed: ${newCount.count} stations in new table vs ${oldCount.count} in old table`);
    }

    // Drop old table and rename new table
    console.log('Dropping old table and renaming new table...');
    db.prepare('DROP TABLE user_stations').run();
    db.prepare('ALTER TABLE user_stations_new RENAME TO user_stations').run();

    // Create indexes (if needed)
    console.log('Creating indexes...');
    db.prepare('CREATE INDEX IF NOT EXISTS idx_user_stations_user_id ON user_stations(user_id)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_user_stations_created_at ON user_stations(created_at DESC)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_user_stations_station_id ON user_stations(station_id)').run();

    // Commit transaction
    db.prepare('COMMIT').run();
    
    console.log('Migration completed successfully!');
    console.log(`Migrated ${newCount.count} stations`);
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
migrateStationsV2().catch(console.error);
