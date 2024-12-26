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

const db: Database.Database = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// Create indexes for better query performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tracks_history_user_id ON tracks_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_tracks_history_created_at ON tracks_history(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_listen_history_user_id ON listen_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_listen_history_created_at ON listen_history(created_at DESC);
`);

// Prepare statements for better performance
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

export const statements: StatementsType = {
  // User management
  createUser: db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name)
    VALUES (@id, @email, @password_hash, @first_name, @last_name)
  `),
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),

  // Session management
  createSession: db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (@id, @user_id, @expires_at)
  `),
  getSession: db.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')"),
  deleteSession: db.prepare('DELETE FROM sessions WHERE id = ?'),
  deleteUserSessions: db.prepare('DELETE FROM sessions WHERE user_id = ?'),

  // Custom stations
  getAllStations: {
    byCreatedAt: db.prepare('SELECT * FROM user_stations ORDER BY created_at DESC'),
    byCreatedAtAsc: db.prepare('SELECT * FROM user_stations ORDER BY created_at ASC'),
    byName: db.prepare('SELECT * FROM user_stations ORDER BY name DESC'),
    byNameAsc: db.prepare('SELECT * FROM user_stations ORDER BY name ASC')
  },
  getStationById: db.prepare('SELECT * FROM user_stations WHERE id = ?'),
  upsertStation: db.prepare(`
    INSERT INTO user_stations (id, name, logo, listen_url)
    VALUES (@id, @name, @logo, @listen_url)
    ON CONFLICT(id) DO UPDATE SET
      name=@name,
      logo=@logo,
      listen_url=@listen_url
  `),
  deleteStation: db.prepare('DELETE FROM user_stations WHERE id = ?'),

  // Track management
  upsertTrackMatch: db.prepare(`
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
  addTrackHistory: db.prepare(`
    INSERT INTO tracks_history (track_id, user_id)
    VALUES (@track_id, @user_id)
  `),
  getTrackHistory: db.prepare(`
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
  deleteTrackHistory: db.prepare('DELETE FROM tracks_history WHERE track_id = ? AND user_id = ?'),
  clearTrackHistory: db.prepare('DELETE FROM tracks_history WHERE user_id = ?'),

  // Listen history
  addListenHistory: db.prepare(`
    INSERT INTO listen_history (station_id, user_id, name, logo, listen_url)
    VALUES (@station_id, @user_id, @name, @logo, @listen_url)
  `),
  getListenHistory: db.prepare(`
    SELECT * FROM listen_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `),
  deleteListenHistory: db.prepare('DELETE FROM listen_history WHERE station_id = ? AND user_id = ?'),
  clearListenHistory: db.prepare('DELETE FROM listen_history WHERE user_id = ?')
};

export { db };
