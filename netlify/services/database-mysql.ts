import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { DatabaseInterface } from './database-interface';
import type { DbUser, DbSession, DbStation, DbUserTrack, DbUserTracksResult } from './database-interface';
import logger from './logger';

dotenv.config();

// Database connection management
const MAX_RETRIES = 3;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

class DatabaseManager implements DatabaseInterface {
  private pool: mysql.Pool | null = null;
  private lastHealthCheck: number = Date.now();

  constructor() {
    this.initializeDatabase();
    this.setupHealthCheck();
    this.initializeTables();
  }

  private async initializeDatabase(): Promise<void> {
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        this.pool = mysql.createPool({
          host: process.env.MYSQL_HOST || 'localhost',
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DATABASE,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          timezone: '+00:00',
        });

        // Test connection
        await this.pool.query('SELECT 1');
        logger.writeInfo('MySQL connection established successfully');
        return;
      } catch (error) {
        retries++;
        logger.writeError('Database initialization attempt failed', { attempt: retries, error });
        if (retries === MAX_RETRIES) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Failed to initialize database after multiple attempts');
  }

  private async initializeTables(): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');

    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        access_level INT(4) DEFAULT 0,
        delete_me TINYINT(1) DEFAULT 0,
        external_ident VARCHAR(255) NOT NULL DEFAULT ''
      )`,

      `CREATE TABLE IF NOT EXISTS password_resets (
        token VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      `CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      `CREATE TABLE IF NOT EXISTS user_stations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        station_id VARCHAR(255),
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        logo TEXT,
        listen_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE KEY unique_user_station (user_id, station_id)
      )`,

      `CREATE TABLE IF NOT EXISTS track_matches (
        id VARCHAR(255) PRIMARY KEY,
        artist VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        release_date DATETIME NULL,
        artwork TEXT,
        apple_music_url TEXT,
        youtube_url TEXT,
        spotify_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS tracks_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        track_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (track_id) REFERENCES track_matches(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      `CREATE TABLE IF NOT EXISTS listen_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        station_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        logo TEXT,
        listen_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      `CREATE TABLE IF NOT EXISTS user_tracks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        track_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (track_id) REFERENCES track_matches(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      `CREATE TABLE IF NOT EXISTS recommendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        station_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        logo TEXT,
        listen_url TEXT NOT NULL,
        sorting INT(4) NOT NULL DEFAULT '0',
        UNIQUE KEY unique_station (station_id)
      )`,

      `CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        headline VARCHAR(255) NOT NULL,
        headline_1 VARCHAR(255) NOT NULL,
        tags VARCHAR(255) DEFAULT '',
        tags_1 VARCHAR(255) DEFAULT '',
        content TEXT,
        content_1 TEXT,
        url TEXT DEFAULT '',
        url_1 TEXT DEFAULT '',
        imageurl TEXT DEFAULT '',
        newsdate VARCHAR(255) NOT NULL DEFAULT '',
        newsdate_1 VARCHAR(255) NOT NULL DEFAULT '',
        active INT(1) NOT NULL DEFAULT '1',
        sorting INT(4) NOT NULL DEFAULT '0'
      )`,

      // Indexes - MySQL doesn't support IF NOT EXISTS for indexes, so we'll handle duplicates in the catch block
      'CREATE INDEX idx_password_resets_token ON password_resets(token)',
      'CREATE INDEX idx_tracks_history_user_id ON tracks_history(user_id)',
      'CREATE INDEX idx_tracks_history_created_at ON tracks_history(created_at DESC)',
      'CREATE INDEX idx_listen_history_user_id ON listen_history(user_id)',
      'CREATE INDEX idx_listen_history_created_at ON listen_history(created_at DESC)',
      'CREATE INDEX idx_user_tracks_user_id ON user_tracks(user_id)',
      'CREATE INDEX idx_user_tracks_created_at ON user_tracks(created_at DESC)',
      'CREATE INDEX idx_user_stations_user_id ON user_stations(user_id)',
      'CREATE INDEX idx_user_stations_created_at ON user_stations(created_at DESC)'
    ];

    for (const query of queries) {
      try {
        await this.pool.query(query);
      } catch (error: any) {
        // Ignore "duplicate key" errors for indexes
        if (error.code === 'ER_DUP_KEYNAME') {
          logger.writeInfo('Index already exists', { query });
          continue;
        }
        logger.writeError('Error executing query', { query, error });
        throw error;
      }
    }
  }

  private setupHealthCheck(): void {
    setInterval(async () => {
      if (Date.now() - this.lastHealthCheck > HEALTH_CHECK_INTERVAL) {
        await this.checkHealth();
      }
    }, HEALTH_CHECK_INTERVAL);
  }

  private async cleanupExpiredTokens(): Promise<void> {
    if (!this.pool) return;

    try {
      await this.pool.query('DELETE FROM password_resets WHERE expires_at < NOW()');
    } catch (error) {
      logger.writeError('Failed to cleanup expired tokens', error);
    }
  }

  private async checkHealth(): Promise<boolean> {
    try {
      await this.cleanupExpiredTokens();

      if (!this.pool) {
        logger.writeError('Database connection is closed, attempting to reconnect');
        await this.initializeDatabase();
        logger.writeInfo('Database reconnection successful');
      }

      await this.pool?.query('SELECT 1');
      this.lastHealthCheck = Date.now();
      return true;
    } catch (error) {
      logger.writeError('Database health check failed', error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  // User operations
  async createUser(user: { id: string; email: string; password_hash: string; first_name: string; last_name: string; external_ident: string }): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, external_ident) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.email, user.password_hash, user.first_name, user.last_name, user.external_ident]
    );
  }

  async getUserByEmail(email: string): Promise<DbUser | null> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>('SELECT * FROM users WHERE (email = ? OR external_ident = ?)', [email, email]);
    return rows[0] as DbUser || null;
  }

  async getUserById(id: string): Promise<DbUser | null> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] as DbUser || null;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  }

  // Session operations
  async createSession(session: { id: string; user_id: string; expires_at: string }): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    
    const expiresAt = session.expires_at.substring(0, 19); // Keep only YYYY-MM-DDTHH:mm:ss part
    await this.pool.query(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, STR_TO_DATE(?, "%Y-%m-%dT%H:%i:%s"))',
      [session.id, session.user_id, expiresAt]
    );
  }

  async getSession(id: string): Promise<DbSession | null> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM sessions WHERE id = ? AND expires_at > NOW()',
      [id]
    );
    return rows[0] as DbSession || null;
  }

  async deleteSession(id: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('DELETE FROM sessions WHERE id = ?', [id]);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('DELETE FROM sessions WHERE user_id = ?', [userId]);
  }

  // Password reset operations
  async createPasswordReset(reset: { token: string; user_id: string; expires_at: string }): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    
    const expiresAt = reset.expires_at.substring(0, 19); // Keep only YYYY-MM-DDTHH:mm:ss part
    await this.pool.query(
      'INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, STR_TO_DATE(?, "%Y-%m-%dT%H:%i:%s"))',
      [reset.token, reset.user_id, expiresAt]
    );
  }

  async getPasswordReset(token: string): Promise<{ user_id: string; expires_at: string } | null> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      'SELECT user_id, expires_at FROM password_resets WHERE token = ?',
      [token]
    );
    return rows[0] as { user_id: string; expires_at: string } || null;
  }

  async deletePasswordReset(token: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('DELETE FROM password_resets WHERE token = ?', [token]);
  }

  async markUserDeletion (userId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('UPDATE users SET delete_me = 1 WHERE id = ?', [userId]);
  }

  // Station operations
  async getAllStations(userId: string, orderBy: string = 'created_at', ascending: boolean = false, limit: number = 50, searchTerm: string = ''): Promise<DbStation[]> {
    if (!this.pool) throw new Error('Database not initialized');
    const order = ascending ? 'ASC' : 'DESC';
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM user_stations WHERE user_id = ? 
      AND name like ?      
      ORDER BY ${orderBy} ${order} 
      LIMIT ${limit}`,
      [userId, '%' + searchTerm + '%']
    );
    return rows as DbStation[];
  }

  async getStationById(id: string, userId: string): Promise<DbStation | null> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      'SELECT *, station_id AS stationId FROM user_stations WHERE station_id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] as DbStation || null;
  }

  async upsertStation(station: { station_id: string; user_id: string; name: string; logo: string | null; listen_url: string }): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query(
      `INSERT INTO user_stations (station_id, user_id, name, logo, listen_url)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       logo = VALUES(logo),
       listen_url = VALUES(listen_url)`,
      [station.station_id, station.user_id, station.name, station.logo, station.listen_url]
    );
  }

  async deleteStation(id: string, userId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('DELETE FROM user_stations WHERE station_id = ? AND user_id = ?', [id, userId]);
  }

  // Track operations
  async upsertTrackMatch(track: {
    id: string;
    artist: string;
    title: string;
    album: string | null;
    release_date: string | null;
    artwork: string | null;
    apple_music_url: string;
    youtube_url: string;
    spotify_url: string;
  }): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    
    // Handle the case where release_date might be null or an ISO-8601 string
    const releaseDateValue = track.release_date ? '?' : 'NULL';

    // Convert ISO string to MySQL date format (YYYY-MM-DD)
    const releaseDateString = track.release_date ? 
      new Date(track.release_date).toISOString().split('T')[0] :
      null;
    
    const query = `
      INSERT INTO track_matches
       (id, artist, title, album, release_date, artwork, apple_music_url, youtube_url, spotify_url)
       VALUES (?, ?, ?, ?, ${releaseDateValue}, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       artist = VALUES(artist),
       title = VALUES(title),
       album = VALUES(album),
       release_date = ${releaseDateValue},
       artwork = VALUES(artwork),
       apple_music_url = VALUES(apple_music_url),
       youtube_url = VALUES(youtube_url),
       spotify_url = VALUES(spotify_url)
    `;

    // Build parameters array based on whether release_date is present
    const params = [
      track.id,
      track.artist,
      track.title,
      track.album,
      // Add release_date parameter if present
      ...(track.release_date ? [releaseDateString] : []),
      track.artwork,
      track.apple_music_url,
      track.youtube_url,
      track.spotify_url,
      // Add release_date parameter again for the UPDATE part
      ...(track.release_date ? [releaseDateString] : [])
    ];

    await this.pool.query(query, params);
  }

  async addTrackHistory(trackId: string, userId: string, stationId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query(
      'INSERT INTO tracks_history (track_id, user_id, station_id) VALUES (?, ?, ?)',
      [trackId, userId, stationId]
    );
  }

  async getTrackHistory(userId: string, limit: number, searchTerm: string): Promise<any[]> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      `SELECT DISTINCT
          th.*,
          tm.id as track_id,
          tm.artist,
          tm.title,
          tm.album,
          tm.release_date,
          tm.artwork,
          tm.apple_music_url,
          tm.youtube_url,
          tm.spotify_url,
          lh.name as station_name,
          lh.logo as station_logo,
          lh.listen_url as station_url
      FROM tracks_history th
      JOIN track_matches tm ON th.track_id = tm.id
      LEFT JOIN listen_history lh ON th.station_id = lh.station_id AND th.user_id = lh.user_id
      WHERE th.user_id = ?
      AND (tm.artist LIKE ? OR tm.title LIKE ?)
      GROUP BY th.track_id
      ORDER BY th.created_at DESC
      LIMIT ${limit}`,
      [userId, '%' + searchTerm + '%', '%' + searchTerm + '%']
    );
    return rows;
  }

  async deleteTrackHistory(id: string, userId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('DELETE FROM tracks_history WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async clearTrackHistory(userId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('DELETE FROM tracks_history WHERE user_id = ?', [userId]);
  }

  // User tracks operations
  async getAllUserTracks (
    userId: string,
    orderBy: string = 'created_at',
    ascending: boolean = false,
    limit: number = 50,
    searchTerm: string = '',
    offset: number = 0,
  ): Promise<DbUserTracksResult> {
    if (!this.pool) throw new Error('Database not initialized');
    const order = ascending ? 'ASC' : 'DESC';
    const orderField = orderBy === 'title' ? 'tm.title' : 'ut.created_at';

    // Prepare the search query
    const searchQuery = '%' + searchTerm + '%';

    // Data query
    const dataQuery = `SELECT DISTINCT
    ut.*,
    tm.id as track_id,
    tm.artist,
    tm.title,
    tm.album,
    tm.release_date,
    tm.artwork,
    tm.apple_music_url,
    tm.youtube_url,
    tm.spotify_url,
    tm.release_date as releaseDate,
    tm.spotify_url AS spotifyUrl,
    tm.apple_music_url as appleMusicUrl,
    tm.youtube_url as youTubeUrl,
    lh.name as station_name,
    lh.logo as station_logo,
    lh.listen_url as station_url
  FROM user_tracks ut
  JOIN track_matches tm ON ut.track_id = tm.id
  LEFT JOIN listen_history lh ON ut.station_id = lh.station_id AND ut.user_id = lh.user_id
  WHERE ut.user_id = ?
  AND (tm.artist LIKE ? OR tm.title LIKE ?)
  GROUP BY ut.track_id
  ORDER BY ${orderField} ${order}
  LIMIT ${offset}, ${limit}`;

    // Count query
    const countQuery = `SELECT COUNT(DISTINCT ut.track_id) as totalCount
  FROM user_tracks ut
  JOIN track_matches tm ON ut.track_id = tm.id
  LEFT JOIN listen_history lh ON ut.station_id = lh.station_id AND ut.user_id = lh.user_id
  WHERE ut.user_id = ?
  AND (tm.artist LIKE ? OR tm.title LIKE ?)`;

    // Execute both queries in parallel
    const [dataResult, countResult] = await Promise.all([
      this.pool.query<mysql.RowDataPacket[]>(dataQuery, [userId, searchQuery, searchQuery]),
      this.pool.query<mysql.RowDataPacket[]>(countQuery, [userId, searchQuery, searchQuery])
    ]);

    const rows = dataResult[0] as DbUserTrack[];
    const totalCount = countResult[0][0]?.totalCount || 0;

    return {
      data: rows,
      totalCount: totalCount
    };
  }

  async getUserTrackById(trackId: string, userId: string): Promise<DbUserTrack | null> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM user_tracks WHERE track_id = ? AND user_id = ?',
      [trackId, userId]
    );
    return rows[0] as DbUserTrack || null;
  }

  async addUserTrack(trackId: string, userId: string, stationId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query(
      'INSERT INTO user_tracks (track_id, user_id, station_id) VALUES (?, ?, ?)',
      [trackId, userId, stationId]
    );
  }

  async getUserTracks(userId: string, limit: number): Promise<any[]> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      `SELECT DISTINCT
        ut.*,
        tm.id as track_id,
        tm.artist,
        tm.title,
        tm.album,
        tm.release_date,
        tm.artwork,
        tm.apple_music_url,
        tm.youtube_url,
        tm.spotify_url,
        tm.release_date as releaseDate,
        tm.spotify_url AS spotifyUrl,
        tm.apple_music_url as appleMusicUrl,
        tm.youtube_url as youTubeUrl,
    	lh.name as station_name,
    	lh.logo as station_logo,
    	lh.listen_url as station_url
      FROM user_tracks ut
      JOIN track_matches tm ON ut.track_id = tm.id
      LEFT JOIN listen_history lh ON ut.station_id = lh.station_id AND ut.user_id = lh.user_id
      WHERE ut.user_id = ?
      GROUP BY ut.track_id
      ORDER BY ut.created_at DESC
      LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }

  async deleteUserTrack(id: string, userId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('DELETE FROM user_tracks WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async clearUserTracks(userId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('DELETE FROM user_tracks WHERE user_id = ?', [userId]);
  }

  // Listen history operations
  async addListenHistory(history: { station_id: string; user_id: string; name: string; logo: string | null; listen_url: string }): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query(
      'INSERT INTO listen_history (station_id, user_id, name, logo, listen_url) VALUES (?, ?, ?, ?, ?)',
      [history.station_id, history.user_id, history.name, history.logo, history.listen_url]
    );
  }

  async getListenHistory(userId: string, limit: number, searchTerm: string): Promise<any[]> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM listen_history
       WHERE user_id = ?
       AND name LIKE ?
       ORDER BY created_at DESC
       LIMIT ${limit}`,
      [userId, '%' + searchTerm + '%']
    );
    return rows;
  }

  async getRecommendations (/*userId: string, */limit: number): Promise<any[]> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM recommendations
       WHERE 1
       ORDER BY sorting ASC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  async getNews (/*userId: string, */limit: number): Promise<any[]> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM news
       WHERE 1
       ORDER BY sorting ASC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }
  async getUserRights (): Promise<any[]> {
    if (!this.pool) throw new Error('Database not initialized');
    const [rows] = await this.pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM user_rights
       WHERE 1
       ORDER BY ident ASC
       `,
      []
    );
    return rows;
  }

  async deleteListenHistory(id: string, userId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('DELETE FROM listen_history WHERE id = ? AND user_id = ?', [id, userId]);
  }

  async clearListenHistory(userId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');
    await this.pool.query('DELETE FROM listen_history WHERE user_id = ?', [userId]);
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

// Setup cleanup handlers
process.on('SIGINT', async () => {
  logger.writeInfo('Closing database connection...');
  await dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.writeInfo('Closing database connection...');
  await dbManager.close();
  process.exit(0);
});

process.on('exit', async () => {
  await dbManager.close();
});

export {
  dbManager
};
