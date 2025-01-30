import type { DbUser, DbSession, DbStation, DbUserTrack, FrontendUserTrack } from './database';

// Define the interface that both SQLite and MySQL implementations must follow
export interface DatabaseInterface {
  createUser(user: { id: string; email: string; password_hash: string; first_name: string; last_name: string }): Promise<void>;
  getUserByEmail(email: string): Promise<DbUser | null>;
  getUserById(id: string): Promise<DbUser | null>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  createSession(session: { id: string; user_id: string; expires_at: string }): Promise<void>;
  getSession(id: string): Promise<DbSession | null>;
  deleteSession(id: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  getAllStations (userId: string, orderBy?: string, ascending?: boolean, limit?: number, seachTerm?: string): Promise<DbStation[]>;
  getStationById(id: string, userId: string): Promise<DbStation | null>;
  upsertStation(station: { station_id: string; user_id: string; name: string; logo: string | null; listen_url: string }): Promise<void>;
  deleteStation(id: string, userId: string): Promise<void>;
  upsertTrackMatch(track: {
    id: string;
    artist: string;
    title: string;
    album: string | null;
    release_date: string | null;
    artwork: string | null;
    apple_music_url: string;
    youtube_url: string;
    spotify_url: string;
  }): Promise<void>;
  addTrackHistory (trackId: string, userId: string, stationId: string): Promise<void>;
  getTrackHistory(userId: string, limit: number, searchTerm: string): Promise<any[]>;
  getRecommendations (/*userId: string, */limit: number): Promise<any[]>;
  deleteTrackHistory(id: string, userId: string): Promise<void>;
  clearTrackHistory(userId: string): Promise<void>;
  getAllUserTracks(userId: string, orderBy?: string, ascending?: boolean, limit?: number, seachTerm?: string): Promise<DbUserTrack[]>;
  getUserTrackById(trackId: string, userId: string): Promise<DbUserTrack | null>;
  addUserTrack(trackId: string, userId: string, stationId: string): Promise<void>;
  getUserTracks(userId: string, limit: number): Promise<any[]>;
  deleteUserTrack(id: string, userId: string): Promise<void>;
  clearUserTracks(userId: string): Promise<void>;
  addListenHistory(history: { station_id: string; user_id: string; name: string; logo: string | null; listen_url: string }): Promise<void>;
  getListenHistory(userId: string, limit: number, searchTerm?: string): Promise<any[]>;
  deleteListenHistory(id: string, userId: string): Promise<void>;
  clearListenHistory(userId: string): Promise<void>;
  close(): Promise<void>;
  
  // Password reset operations
  createPasswordReset(reset: { token: string; user_id: string; expires_at: string }): Promise<void>;
  getPasswordReset(token: string): Promise<{ user_id: string; expires_at: string } | null>;
  deletePasswordReset(token: string): Promise<void>;
}

export type {
  DbUser,
  DbSession,
  DbStation,
  DbUserTrack,
  FrontendUserTrack
};
