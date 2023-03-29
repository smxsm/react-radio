import { useCallback, useState } from 'react';
import useSupabase from './useSupabase';

export default function useCustomStations() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stations, setStations] = useState<RadioStation[]>([]);

  const getCustomStations = useCallback(
    async (id = '') => {
      setLoading(true);
      let query = supabase.from('user_stations').select('*');
      if (id) {
        query = query.eq('id', id);
      }
      const { data, error } = await query;
      if (error) {
        setError(new Error(error.message));
      }
      setStations(
        data?.map<RadioStation>(({ id, name, logo, listen_url }) => ({
          id,
          name,
          logo,
          listenUrl: listen_url,
          isOwner: true,
        })) || []
      );
      setLoading(false);
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
