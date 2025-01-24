import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.resolve(process.env.DB_PATH || './data/radio.db');

async function migrateStationsV4() {
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
    db.prepare('CREATE TABLE tracks_history_backup AS SELECT * FROM tracks_history').run();

    // Drop existing table
    console.log('Dropping existing table...');
    db.prepare('DROP TABLE tracks_history').run();

    // Create new table
    console.log('Creating new table with user_id...');
    db.prepare(`
      CREATE TABLE tracks_history (
        id TEXT PRIMARY KEY,
        track_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        station_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();

    // Create indexes
    console.log('Creating indexes...');
    db.prepare('CREATE INDEX idx_tracks_history_track_id ON tracks_history(track_id)').run();
    db.prepare('CREATE INDEX idx_tracks_history_user_id ON tracks_history(user_id)').run();
    db.prepare('CREATE INDEX idx_tracks_history_created_at ON tracks_history(created_at DESC)').run();

    // Migrate data
    console.log(`Migrating tracks_history ...`);
    db.prepare(`
      INSERT INTO tracks_history (id, track_id, user_id, station_id, created_at)
      SELECT id, track_id, user_id, '', created_at
      FROM tracks_history_backup
    `).run();

    // Verify migration
    const stationCount = db.prepare('SELECT COUNT(*) as count FROM tracks_history').get();
    const backupCount = db.prepare('SELECT COUNT(*) as count FROM tracks_history_backup').get();
    
    if (stationCount.count !== backupCount.count) {
      throw new Error(`Migration verification failed: ${stationCount.count} tracks in new table vs ${backupCount.count} in backup`);
    }
    console.log('Now dropping table tracks_history_backup');
    db.prepare('DROP TABLE IF EXISTS tracks_history_backup').run(); 

    // Commit transaction
    db.prepare('COMMIT').run();
    
    console.log('Migration completed successfully!');
    console.log(`Migrated ${stationCount.count} tracks`);

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
migrateStationsV4().catch(console.error);
