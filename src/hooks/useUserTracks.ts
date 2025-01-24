import { useCallback, useState } from 'react';
import * as api from '../lib/api';

export default function useUserTracks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tracks, setTracks] = useState<api.TrackInfo[]>([]);

  const getUserTracks = useCallback(
    async (id = '', sort = 'created_at', ascending = false, limit = 50) => {
      try {
        setLoading(true);
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          throw new Error('No session found');
        }

        let data;
        if (id) {
          data = [await api.getUserTrackById(sessionId, id)];
        } else {
          data = await api.getUserTracks(
            sessionId,
            sort,
            ascending ? 'ASC' : 'DESC',
            limit
          );
        }

        const tracks = data.map<api.TrackInfo>(({ id, trackId, title, artist, artwork, album, spotifyUrl, appleMusicUrl, youTubeUrl, createdAt, releaseDate, stationId  }) => ({
          id,
          trackId,
          title,
          artist,
          album,
          releaseDate,
          createdAt,
          artwork,
          appleMusicUrl,
          youTubeUrl,
          spotifyUrl,
          stationId,
        }));

        setTracks(tracks);
        setLoading(false);
        return tracks;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get tracks');
        setError(error);
        setLoading(false);
        return [];
      }
    },
    []
  );

  const addUserTrack = useCallback(
    async (track: string, stationId: string = '') => {
      try {
        setLoading(true);
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          throw new Error('No session found');
        }

        await api.addUserTrack(sessionId, track, stationId);
        
        // Refresh the tracks list after adding
        await getUserTracks();
        
        setLoading(false);
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add track');
        console.error('Error in addUserTrack:', error);
        setError(error);
        setLoading(false);
        return false;
      }
    },
    [getUserTracks]
  );

  const deleteUserTrack = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          throw new Error('No session found');
        }

        await api.deleteUserTrack(sessionId, id);
        
        setLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete track');
        setError(error);
        setLoading(false);
      }
    },
    []
  );

  const clearUserTracks = useCallback(
    async () => {
      try {
        setLoading(true);
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          throw new Error('No session found');
        }

        await api.clearUserTracks(sessionId);

        setLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete track');
        setError(error);
        setLoading(false);
      }
    },
    []
  );
  

  return { loading, error, tracks, getUserTracks, addUserTrack, deleteUserTrack, clearUserTracks };
}
