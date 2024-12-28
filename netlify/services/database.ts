import Database, { Statement, RunResult } from 'better-sqlite3';
import path from 'path';
import { mkdirSync, existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.resolve(process.env.DB_PATH || './data/radio.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Database connection management
const MAX_RETRIES = 3;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// Type definitions
interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
}

interface DbSession {
  id: string;
  user_id: string;
  expires_at: string;
}

interface DbStation {
  id: string;
  name: string;
  logo: string | null;
  listen_url: string;
}

type StatementsType = {
  // User management
  createUser: Statement<[{ id: string; email: string; password_hash: string; first_name: string; last_name: string; }], RunResult>;
  getUserByEmail: Statement<[string], DbUser>;
  getUserById: Statement<[string], DbUser>;
  updateUserPassword: Statement<[{ user_id: string; password_hash: string; }], RunResult>;

  // Password reset
  createPasswordReset: Statement<[{ token: string; user_id: string; expires_at: string; }], RunResult>;
  getPasswordReset: Statement<[string], { user_id: string; expires_at: string; }>;
  deletePasswordReset: Statement<[string], RunResult>;

  // Session management
  createSession: Statement<[{ id: string; user_id: string; expires_at: string; }], RunResult>;
  getSession: Statement<[string], DbSession>;
  deleteSession: Statement<[string], RunResult>;
  deleteUserSessions: Statement<[string], RunResult>;

  // Custom stations
  getAllStations: {
    byCreatedAt: Statement<[], DbStation[]>;
    byCreatedAtAsc: Statement<[], DbStation[]>;
    byName: Statement<[], DbStation[]>;
    byNameAsc: Statement<[], DbStation[]>;
  };
  getStationById: Statement<[string], DbStation>;
  upsertStation: Statement<[{ id: string; name: string; logo: string | null; listen_url: string; }], RunResult>;
  deleteStation: Statement<[string], RunResult>;

  // Track management
  upsertTrackMatch: Statement<[{ id: string; artist: string; title: string; album: string | null; release_date: string | null; artwork: string | null; apple_music_url: string; youtube_url: string; }], RunResult>;
  addTrackHistory: Statement<[{ track_id: string; user_id: string; }], RunResult>;
  getTrackHistory: Statement<[string, number], any[]>;
  deleteTrackHistory: Statement<[string, string], RunResult>;
  clearTrackHistory: Statement<[string], RunResult>;

  // Listen history
  addListenHistory: Statement<[{ station_id: string; user_id: string; name: string; logo: string | null; listen_url: string; }], RunResult>;
  getListenHistory: Statement<[string, number], any[]>;
  deleteListenHistory: Statement<[string, string], RunResult>;
  clearListenHistory: Statement<[string], RunResult>;
};

class DatabaseManager {
  private db: Database.Database | null = null;
  private lastHealthCheck: number = Date.now();
  private statements: StatementsType | null = null;

  constructor() {
    this.db = this.initializeDatabase();
    this.setupHealthCheck();
    this.initializeTables();
    this.prepareStatements();
  }

  private initializeDatabase(): Database.Database {
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const database = new Database(dbPath, {
          timeout: 15000,
          verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
        });
        
        // Configure database
        database.pragma('journal_mode = WAL');
        database.pragma('synchronous = NORMAL'); // Less strict synchronization
        database.pragma('cache_size = -2000'); // 2MB cache
        database.pragma('foreign_keys = ON');
        database.pragma('busy_timeout = 10000'); // Increase timeout to 10s
        
        return database;
      } catch (error) {
        retries++;
        console.error(`Database initialization attempt ${retries} failed:`, error);
        if (retries === MAX_RETRIES) throw error;
      }
    }
    throw new Error('Failed to initialize database after multiple attempts');
  }

  private initializeTables() {
    if (!this.db) throw new Error('Database not initialized');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS user_stations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo TEXT,
        listen_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS track_matches (
        id TEXT PRIMARY KEY,
        artist TEXT NOT NULL,
        title TEXT NOT NULL,
        album TEXT,
        release_date DATETIME,
        artwork TEXT,
        apple_music_url TEXT,
        youtube_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tracks_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (track_id) REFERENCES track_matches(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS listen_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        logo TEXT,
        listen_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
      CREATE INDEX IF NOT EXISTS idx_tracks_history_user_id ON tracks_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_tracks_history_created_at ON tracks_history(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_listen_history_user_id ON listen_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_listen_history_created_at ON listen_history(created_at DESC);
    `);
  }

  private prepareStatements() {
    if (!this.db) throw new Error('Database not initialized');

    this.statements = {
      // User management
      createUser: this.db.prepare(`
        INSERT INTO users (id, email, password_hash, first_name, last_name)
        VALUES (@id, @email, @password_hash, @first_name, @last_name)
      `),
      getUserByEmail: this.db.prepare('SELECT * FROM users WHERE email = ?'),
      getUserById: this.db.prepare('SELECT * FROM users WHERE id = ?'),
      updateUserPassword: this.db.prepare(`
        UPDATE users 
        SET password_hash = @password_hash 
        WHERE id = @user_id
      `),

      // Password reset
      createPasswordReset: this.db.prepare(`
        INSERT INTO password_resets (token, user_id, expires_at)
        VALUES (@token, @user_id, @expires_at)
      `),
      getPasswordReset: this.db.prepare('SELECT user_id, expires_at FROM password_resets WHERE token = ?'),
      deletePasswordReset: this.db.prepare('DELETE FROM password_resets WHERE token = ?'),

      // Session management
      createSession: this.db.prepare(`
        INSERT INTO sessions (id, user_id, expires_at)
        VALUES (@id, @user_id, @expires_at)
      `),
      getSession: this.db.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')"),
      deleteSession: this.db.prepare('DELETE FROM sessions WHERE id = ?'),
      deleteUserSessions: this.db.prepare('DELETE FROM sessions WHERE user_id = ?'),

      // Custom stations
      getAllStations: {
        byCreatedAt: this.db.prepare('SELECT * FROM user_stations ORDER BY created_at DESC'),
        byCreatedAtAsc: this.db.prepare('SELECT * FROM user_stations ORDER BY created_at ASC'),
        byName: this.db.prepare('SELECT * FROM user_stations ORDER BY name DESC'),
        byNameAsc: this.db.prepare('SELECT * FROM user_stations ORDER BY name ASC')
      },
      getStationById: this.db.prepare('SELECT * FROM user_stations WHERE id = ?'),
      upsertStation: this.db.prepare(`
        INSERT INTO user_stations (id, name, logo, listen_url)
        VALUES (@id, @name, @logo, @listen_url)
        ON CONFLICT(id) DO UPDATE SET
          name=@name,
          logo=@logo,
          listen_url=@listen_url
      `),
      deleteStation: this.db.prepare('DELETE FROM user_stations WHERE id = ?'),

      // Track management
      upsertTrackMatch: this.db.prepare(`
        INSERT INTO track_matches (
          id, artist, title, album, release_date,
          artwork, apple_music_url, youtube_url
        )
        VALUES (
          @id, @artist, @title, @album, @release_date,
          @artwork, @apple_music_url, @youtube_url
        )
        ON CONFLICT(id) DO UPDATE SET
          artist=@artist,
          title=@title,
          album=@album,
          release_date=@release_date,
          artwork=@artwork,
          apple_music_url=@apple_music_url,
          youtube_url=@youtube_url
      `),
      addTrackHistory: this.db.prepare(`
        INSERT INTO tracks_history (track_id, user_id)
        VALUES (@track_id, @user_id)
      `),
      getTrackHistory: this.db.prepare(`
        SELECT
          th.*,
          tm.id as track_id,
          tm.artist,
          tm.title,
          tm.album,
          tm.release_date,
          tm.artwork,
          tm.apple_music_url,
          tm.youtube_url
        FROM tracks_history th
        JOIN track_matches tm ON th.track_id = tm.id
        WHERE th.user_id = ?
        ORDER BY th.created_at DESC
        LIMIT ?
      `),
      deleteTrackHistory: this.db.prepare('DELETE FROM tracks_history WHERE track_id = ? AND user_id = ?'),
      clearTrackHistory: this.db.prepare('DELETE FROM tracks_history WHERE user_id = ?'),

      // Listen history
      addListenHistory: this.db.prepare(`
        INSERT INTO listen_history (station_id, user_id, name, logo, listen_url)
        VALUES (@station_id, @user_id, @name, @logo, @listen_url)
      `),
      getListenHistory: this.db.prepare(`
        SELECT * FROM listen_history
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `),
      deleteListenHistory: this.db.prepare('DELETE FROM listen_history WHERE station_id = ? AND user_id = ?'),
      clearListenHistory: this.db.prepare('DELETE FROM listen_history WHERE user_id = ?')
    };
  }

  private setupHealthCheck() {
    setInterval(() => {
      if (Date.now() - this.lastHealthCheck > HEALTH_CHECK_INTERVAL) {
        this.checkHealth();
      }
    }, HEALTH_CHECK_INTERVAL);
  }

  private cleanupExpiredTokens() {
    if (!this.db) return;
    
    try {
      this.db.prepare("DELETE FROM password_resets WHERE expires_at < datetime('now')").run();
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error);
    }
  }

  private checkHealth(): boolean {
    try {
      // Clean up expired tokens every health check
      this.cleanupExpiredTokens();

      if (!this.db?.open) {
        console.error('Database connection is closed, attempting to reconnect...');
        try {
          this.db = this.initializeDatabase();
          this.prepareStatements(); // Re-prepare statements after reconnection
          console.log('Database reconnection successful');
        } catch (reconnectError) {
          console.error('Database reconnection failed:', reconnectError);
          return false;
        }
      }
      
      // Try a simple query to verify connection
      this.db.prepare('SELECT 1').get();
      this.lastHealthCheck = Date.now();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  getDatabase(): Database.Database {
    if (!this.checkHealth()) {
      throw new Error('Database connection is unhealthy');
    }
    if (!this.db) {
      throw new Error('Database is not initialized');
    }
    return this.db;
  }

  getStatements(): StatementsType {
    if (!this.statements) {
      throw new Error('Statements are not prepared');
    }
    return this.statements;
  }

  close() {
    if (this.db?.open) {
      this.db.close();
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

// Setup cleanup handlers
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Closing database connection...');
  dbManager.close();
  process.exit(0);
});

process.on('exit', () => {
  dbManager.close();
});

// Export functions to access database and statements
function getDb(): Database.Database {
  return dbManager.getDatabase();
}

const statements = dbManager.getStatements();

export {
  getDb,
  statements,
  type DbUser,
  type DbSession,
  type DbStation,
  type StatementsType
};
