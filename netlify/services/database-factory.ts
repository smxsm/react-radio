import { DatabaseInterface, DbUser, DbSession, DbStation, DbUserTrack, DbUserTracksResult } from './database-interface';
import { statements, getDb, mapDbToFrontend, mapFrontendToDb } from './database';
import logger from './logger';

// Lazy load MySQL manager only when needed
let mysqlManager: DatabaseInterface | undefined;

class SQLiteAdapter implements DatabaseInterface {
  async createUser(user: Parameters<DatabaseInterface['createUser']>[0]): Promise<void> {
    statements.createUser.run(user);
  }

  async getUserByEmail(email: string): Promise<DbUser | null> {
    return statements.getUserByEmail.get(email) || null;
  }

  async getUserById(id: string): Promise<DbUser | null> {
    return statements.getUserById.get(id) || null;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    statements.updateUserPassword.run({ user_id: userId, password_hash: passwordHash });
  }

  async createSession(session: Parameters<DatabaseInterface['createSession']>[0]): Promise<void> {
    statements.createSession.run(session);
  }

  async getSession(id: string): Promise<DbSession | null> {
    return statements.getSession.get(id) || null;
  }

  async deleteSession(id: string): Promise<void> {
    statements.deleteSession.run(id);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    statements.deleteUserSessions.run(userId);
  }

  async getAllStations (userId: string, orderBy: string = 'created_at', ascending: boolean = false, limit: number = 50, searchTerm: string = ''): Promise<DbStation[]> {
    let result;
    if (orderBy === 'name') {
      result = ascending ? statements.getAllStations.byNameAsc.all(userId, '%' + searchTerm + '%', limit) : statements.getAllStations.byName.all(userId, '%' + searchTerm + '%', limit);
    } else {
      result = ascending ? statements.getAllStations.byCreatedAtAsc.all(userId, '%' + searchTerm + '%', limit) : statements.getAllStations.byCreatedAt.all(userId, '%' + searchTerm + '%', limit);
    }
    return result as unknown as DbStation[];
  }

  async getStationById(id: string, userId: string): Promise<DbStation | null> {
    return statements.getStationById.get(id, userId) || null;
  }

  async upsertStation(station: Parameters<DatabaseInterface['upsertStation']>[0]): Promise<void> {
    statements.upsertStation.run(station);
  }

  async deleteStation(id: string, userId: string): Promise<void> {
    statements.deleteStation.run(id, userId);
  }

  async upsertTrackMatch(track: Parameters<DatabaseInterface['upsertTrackMatch']>[0]): Promise<void> {
    statements.upsertTrackMatch.run(track);
  }

  async addTrackHistory(trackId: string, userId: string, stationId: string): Promise<void> {
    statements.addTrackHistory.run({ track_id: trackId, user_id: userId,  station_id: stationId });
  }

  async getTrackHistory(userId: string, limit: number, searchTerm: string): Promise<any[]> {
    return statements.getTrackHistory.all(userId, '%' + searchTerm + '%', limit);
  }

  async deleteTrackHistory(id: string, userId: string): Promise<void> {
    statements.deleteTrackHistory.run(id, userId);
  }

  async clearTrackHistory(userId: string): Promise<void> {
    statements.clearTrackHistory.run(userId);
  }

  async getAllUserTracks (userId: string, orderBy: string = 'created_at', ascending: boolean = false, limit: number = 50, searchTerm: string = '', offset: number = 0): Promise<DbUserTracksResult> {
    let result;
    if (orderBy === 'title') {
      result = ascending ? statements.getAllUserTracks.byTitleAsc.all(userId, '%' + searchTerm + '%', limit, offset) : statements.getAllUserTracks.byTitle.all(userId, '%' + searchTerm + '%', limit, offset);
    } else {
      result = ascending ? statements.getAllUserTracks.byCreatedAtAsc.all(userId, '%' + searchTerm + '%', limit, offset) : statements.getAllUserTracks.byCreatedAt.all(userId, '%' + searchTerm + '%', limit, offset);
    }
    return result as unknown as DbUserTracksResult;
  }

  async getUserTrackById(trackId: string, userId: string): Promise<DbUserTrack | null> {
    return statements.getUserTrackById.get(trackId, userId) || null;
  }

  async addUserTrack(trackId: string, userId: string, stationId: string): Promise<void> {
    statements.addUserTrack.run({ track_id: trackId, user_id: userId, station_id: stationId });
  }

  async getUserTracks(userId: string, limit: number): Promise<any[]> {
    return statements.getUserTracks.all(userId, limit);
  }

  async getRecommendations (/*userId: string, */limit: number): Promise<any[]> {
    return statements.getRecommendations.all(limit);
  }

  async getNews (/*userId: string, */limit: number): Promise<any[]> {
    return statements.getNews.all(limit);
  }

  async getUserRights (): Promise<any[]> {
    return statements.getUserRights.all();
  }

  async deleteUserTrack(id: string, userId: string): Promise<void> {
    statements.deleteUserTrack.run(id, userId);
  }

  async clearUserTracks(userId: string): Promise<void> {
    statements.clearUserTracks.run(userId);
  }

  async addListenHistory(history: Parameters<DatabaseInterface['addListenHistory']>[0]): Promise<void> {
    statements.addListenHistory.run(history);
  }

  async getListenHistory(userId: string, limit: number, searchTerm: string): Promise<any[]> {
    return statements.getListenHistory.all(userId, '%' + searchTerm + '%', limit);
  }

  async deleteListenHistory(id: string, userId: string): Promise<void> {
    statements.deleteListenHistory.run(id, userId);
  }

  async clearListenHistory(userId: string): Promise<void> {
    statements.clearListenHistory.run(userId);
  }

  async close(): Promise<void> {
    getDb().close();
  }

  // Password reset operations
  async createPasswordReset(reset: { token: string; user_id: string; expires_at: string }): Promise<void> {
    statements.createPasswordReset.run(reset);
  }

  async getPasswordReset(token: string): Promise<{ user_id: string; expires_at: string } | null> {
    return statements.getPasswordReset.get(token) || null;
  }

  async deletePasswordReset(token: string): Promise<void> {
    statements.deletePasswordReset.run(token);
  }
}

class DatabaseFactory {
  private static instance: DatabaseInterface;

  static async getInstance(): Promise<DatabaseInterface> {
    if (!DatabaseFactory.instance) {
      const dbType = process.env.DB_TYPE || 'sqlite';
      
      logger.writeInfo(`Initializing ${dbType} database connection`);
      
      switch (dbType.toLowerCase()) {
        case 'mysql':
          if (!mysqlManager) {
            const module = await import('./database-mysql');
            mysqlManager = module.dbManager;
          }
          DatabaseFactory.instance = mysqlManager!;
          break;
        case 'sqlite':
          DatabaseFactory.instance = new SQLiteAdapter();
          break;
        default:
          logger.writeWarn(`Unknown database type: ${dbType}, falling back to SQLite`);
          DatabaseFactory.instance = new SQLiteAdapter();
      }
    }
    
    return DatabaseFactory.instance;
  }
}

export {
  DatabaseFactory,
  mapDbToFrontend,
  mapFrontendToDb
};
