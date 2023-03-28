import { useCallback, useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/UserContext';
import useSupabase from './useSupabase';

export type CustomStation = {
  name: string;
  logo: string;
  listenUrl: string;
};

export default function useCustomStations() {
  const supabase = useSupabase();
  const { user } = useContext(UserContext)!;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stations, setStations] = useState<RadioStation[]>([]);

  const getCustomStations = useCallback(async () => {
    const { data, error } = await supabase.from('user_stations').select('*');
    if (error) throw error;
    return data;
  }, [supabase]);

  const addCustomStation = useCallback(
    async ({ name, logo, listenUrl }: CustomStation) => {
      setLoading(true);
      const { error } = await supabase.from('user_stations').upsert({ name, logo, listen_url: listenUrl }).select();
      if (error) {
        setError(new Error(error.message));
        setLoading(false);
        return false;
      }

      return true;
    },
    [supabase]
  );

  useEffect(() => {
    getCustomStations()
      .then((stations) =>
        stations.map<RadioStation>(({ id, name, logo, listen_url }) => ({ id, name, listenUrl: listen_url, logo }))
      )
      .then(setStations)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [getCustomStations, user]);

  return { loading, error, stations, addCustomStation };
}
