import { useCallback, useState } from 'react';
import * as api from '../lib/api';

export function useHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [trackHistory, setTrackHistory] = useState<api.TrackHistory[]>([]);
  const [stationHistory, setStationHistory] = useState<api.RadioStation[]>([]);

  const getTrackHistory = useCallback(async (limit = 50) => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        throw new Error('No session found');
      }

      const history = await api.getTrackHistory(sessionId, limit);
      setTrackHistory(history);
      setLoading(false);
      return history;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get track history');
      setError(error);
      setLoading(false);
      return [];
    }
  }, []);

  const addTrackToHistory = useCallback(async (trackInfo: api.TrackInfo) => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        throw new Error('No session found');
      }

      await api.addTrackToHistory(sessionId, trackInfo);
      setLoading(false);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add track to history');
      setError(error);
      setLoading(false);
      return false;
    }
  }, []);

  const deleteTrackFromHistory = useCallback(async (trackId: string) => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        throw new Error('No session found');
      }

      await api.deleteTrackFromHistory(sessionId, trackId);
      setLoading(false);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete track from history');
      setError(error);
      setLoading(false);
      return false;
    }
  }, []);

  const clearTrackHistory = useCallback(async () => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        throw new Error('No session found');
      }

      await api.clearTrackHistory(sessionId);
      setTrackHistory([]);
      setLoading(false);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to clear track history');
      setError(error);
      setLoading(false);
      return false;
    }
  }, []);

  const getStationHistory = useCallback(async (limit = 50) => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        throw new Error('No session found');
      }

      const history = await api.getListenHistory(sessionId, limit);
      setStationHistory(history);
      setLoading(false);
      return history;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get station history');
      setError(error);
      setLoading(false);
      return [];
    }
  }, []);

  const addStationToHistory = useCallback(async (station: api.RadioStation) => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        throw new Error('No session found');
      }

      await api.addStationToHistory(sessionId, station);
      setLoading(false);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add station to history');
      setError(error);
      setLoading(false);
      return false;
    }
  }, []);

  const deleteStationFromHistory = useCallback(async (stationId: string) => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        throw new Error('No session found');
      }

      await api.deleteStationFromHistory(sessionId, stationId);
      setLoading(false);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete station from history');
      setError(error);
      setLoading(false);
      return false;
    }
  }, []);

  const clearStationHistory = useCallback(async () => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        throw new Error('No session found');
      }

      await api.clearListenHistory(sessionId);
      setStationHistory([]);
      setLoading(false);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to clear station history');
      setError(error);
      setLoading(false);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    trackHistory,
    stationHistory,
    getTrackHistory,
    addTrackToHistory,
    deleteTrackFromHistory,
    clearTrackHistory,
    getStationHistory,
    addStationToHistory,
    deleteStationFromHistory,
    clearStationHistory,
  };
}
