import { useCallback, useState } from 'react';
import * as api from '../lib/api';

export default function useCustomStations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stations, setStations] = useState<api.RadioStation[]>([]);

  const getCustomStations = useCallback(
    async (id = '', sort = 'created_at', ascending = false) => {
      try {
        setLoading(true);
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          throw new Error('No session found');
        }

        let data;
        if (id) {
          data = [await api.getCustomStationById(sessionId, id)];
        } else {
          data = await api.getCustomStations(
            sessionId,
            sort,
            ascending ? 'ASC' : 'DESC'
          );
        }

        const stations = data.map<api.RadioStation>(({ id, name, logo, listen_url, station_id }) => ({
          id,
          name,
          logo: logo || '',
          listenUrl: listen_url,
          isOwner: true,
          stationId: station_id,
        }));

        setStations(stations);
        setLoading(false);
        return stations;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get stations');
        setError(error);
        setLoading(false);
        return [];
      }
    },
    []
  );

  const addCustomStation = useCallback(
    async (station: api.RadioStation) => {
      try {
        setLoading(true);
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          throw new Error('No session found');
        }

        await api.addCustomStation(sessionId, station);
        setLoading(false);
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add station');
        setError(error);
        setLoading(false);
        return false;
      }
    },
    []
  );

  const deleteCustomStation = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          throw new Error('No session found');
        }

        await api.deleteCustomStation(sessionId, id);
        setLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete station');
        setError(error);
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, stations, getCustomStations, addCustomStation, deleteCustomStation };
}
