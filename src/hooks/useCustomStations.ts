import { useCallback, useState } from 'react';
import useSupabase from './useSupabase';

export default function useCustomStations() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stations, setStations] = useState<RadioStation[]>([]);

  const getCustomStations = useCallback(
    async (id = '', sort = 'created_at', ascending = true) => {
      setLoading(true);
      let query = supabase.from('user_stations').select('*');
      if (id) {
        query = query.eq('id', id);
      }
      if (sort !== 'created_at' && sort !== 'name') {
        sort = 'created_at';
      }
      query = query.order(sort, { ascending });
      const { data, error } = await query;
      if (error) {
        setError(new Error(error.message));
        setLoading(false);
        return [];
      }
      const stations =
        data?.map<RadioStation>(({ id, name, logo, listen_url }) => ({
          id,
          name,
          logo,
          listenUrl: listen_url,
          isOwner: true,
        })) || [];
      setStations(stations);
      setLoading(false);
      return stations;
    },
    [supabase]
  );

  const addCustomStation = useCallback(
    async ({ id, name, logo, listenUrl }: RadioStation) => {
      setLoading(true);
      const { error } = await supabase.from('user_stations').upsert({ id, name, logo, listen_url: listenUrl }).select();
      if (error) {
        setError(new Error(error.message));
        setLoading(false);
        return false;
      }

      setLoading(false);
      return true;
    },
    [supabase]
  );

  const deleteCustomStation = useCallback(
    async (id: string) => {
      setLoading(true);
      const { error } = await supabase.from('user_stations').delete().eq('id', id);
      if (error) {
        setError(new Error(error.message));
      }
    },
    [supabase]
  );

  return { loading, error, stations, getCustomStations, addCustomStation, deleteCustomStation };
}
