import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { PlayerContext } from './PlayerContext';
import { UserContext } from './UserContext';
import useSupabase from '../hooks/useSupabase';

type NowPlayingContextType = {
  station?: RadioStation;
  stationMetadata?: StationMetadata;
  matchedTrack?: TrackInfo;
  stationHistory?: RadioStation[];
  songHistory?: TrackHistory[];
  removeSongFromHistory: (id: string) => Promise<void>;
  clearSongHistory: () => Promise<void>;
  removeStationFromHistory: (id: string) => Promise<void>;
  clearStationHistory: () => Promise<void>;
};

type StationMetadata = {
  icyGenre: string[];
  icyAudioInfo: icyAudioInfo;
  icyName: string;
  icyDescription: string;
  icyUrl: string;
  icyBr: number;
  icySr: number;
  icyLogo: string;
  icyCountryCode: string;
  icyCountrySubdivisionCode: string;
  icyLanguageCodes: string[];
  icyGeoLatLong: string;
  contentType: string;
  title: string;
  trackMatch?: TrackInfo;
};

type icyAudioInfo = {
  bitRate: number;
  quality: number;
  channels: number;
  sampleRate: number;
};

type TrackInfo = {
  id: string;
  artist: string;
  title: string;
  album: string;
  releaseDate: Date | null;
  artwork: string;
  appleMusicUrl?: string;
  youTubeUrl?: string;
};

type TrackHistory = TrackInfo & {
  heardAt: Date;
};

type NowPlayingInfoProviderProps = PropsWithChildren & {};

export const NowPlayingContext = createContext<NowPlayingContextType | null>(null);

export function NowPlayingProvider({ children }: NowPlayingInfoProviderProps) {
  const supabase = useSupabase();
  const playerContext = useContext(PlayerContext);
  const { user } = useContext(UserContext) || {};
  const [station, setStation] = useState<RadioStation | undefined>();
  const [stationMetadata, setStationMetadata] = useState<StationMetadata | undefined>();
  const [matchedTrack, setMatchedTrack] = useState<TrackInfo | undefined>();
  const [stationHistory, setStationHistory] = useState<RadioStation[]>([]);
  const [songHistory, setSongHistory] = useState<TrackHistory[]>([]);
  const intervalRef = useRef<NodeJS.Timer | number>(0);
  const abortControllerRef = useRef(new AbortController());

  const loadTrackHistory = useCallback(() => {
    supabase
      .from('tracks_history')
      .select('*, track_match(*)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) throw error;
        return data.map<TrackHistory>((entry) => ({
          heardAt: new Date(entry.created_at),
          id: entry.track_match.id,
          artist: entry.track_match.artist,
          title: entry.track_match.title,
          album: entry.track_match.album,
          releaseDate: new Date(entry.track_match.release_date),
          artwork: entry.track_match.artwork,
          appleMusicUrl: entry.track_match.apple_music_url,
          youTubeUrl: entry.track_match.youtube_url,
        }));
      })
      .then(setSongHistory);
  }, [supabase]);

  const loadStationHistory = useCallback(() => {
    supabase
      .from('listen_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          return;
        }
        setStationHistory(
          data.map<RadioStation>((entry) => ({
            id: entry.station_id,
            name: entry.name,
            logo: entry.logo,
            listenUrl: entry.listen_url,
          }))
        );
      });
  }, [supabase]);

  // Update played stations history
  useEffect(() => {
    if (playerContext?.status !== 'playing') {
      return;
    }
    supabase
      .from('listen_history')
      .upsert({
        station_id: playerContext.station?.id,
        name: playerContext.station?.name,
        logo: playerContext.station?.logo,
        listen_url: playerContext.station?.listenUrl,
        created_at: new Date().toISOString(),
      })
      .then(() => loadStationHistory());
  }, [playerContext?.station, playerContext?.status, supabase, loadStationHistory]);

  // Get station metadata on interval
  useEffect(() => {
    const getNowPlayingInfo = async (url: string | undefined) => {
      if (!url) return;
      try {
        abortControllerRef.current = new AbortController();
        const res = await fetch('https://radio.ivanoff.dev/station-metadata?url=' + url, {
          signal: abortControllerRef.current.signal,
        });
        const result = await res.json();
        setStationMetadata(result.stationMetadata);
        if (!result.matchedTrack) {
          return setMatchedTrack(undefined);
        }
        setMatchedTrack({
          ...result.matchedTrack,
          releaseDate: new Date(result.matchedTrack.releaseDate),
        });
      } catch (err) {}
    };

    clearInterval(intervalRef.current);
    if (!abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort();
    }

    if (playerContext?.status === 'stopped' || playerContext?.status === 'error') {
      setStation(undefined);
      setStationMetadata(undefined);
      setMatchedTrack(undefined);
      return;
    }

    if (playerContext?.station?.listenUrl !== station?.listenUrl) {
      setStationMetadata(undefined);
      setMatchedTrack(undefined);
      setStation(playerContext?.station);
    }

    if (playerContext?.status === 'playing') {
      getNowPlayingInfo(playerContext.station?.listenUrl);
      intervalRef.current = setInterval(() => getNowPlayingInfo(playerContext.station?.listenUrl), 10000);
    }

    return () => clearInterval(intervalRef.current);
  }, [playerContext?.station, playerContext?.status, station?.listenUrl]);

  // Add matched track to history
  useEffect(() => {
    if (!matchedTrack?.id) return;

    supabase
      .from('tracks_history')
      .upsert({ track_id: matchedTrack?.id, created_at: new Date().toISOString() })
      .then(() => loadTrackHistory());
  }, [supabase, matchedTrack?.id, loadTrackHistory]);

  useEffect(() => {
    if (!user) {
      setStationHistory([]);
      setSongHistory([]);
      return;
    }
    loadStationHistory();
    loadTrackHistory();
  }, [supabase, user, loadStationHistory, loadTrackHistory]);

  const removeSongFromHistory = useCallback(
    async (id: string) => {
      if (!id) return;
      await supabase.from('tracks_history').delete().eq('track_id', id);
      loadTrackHistory();
    },
    [supabase, loadTrackHistory]
  );

  const clearSongHistory = useCallback(async () => {
    await supabase.from('tracks_history').delete().neq('track_id', '00000000-0000-0000-0000-000000000000');
    loadTrackHistory();
  }, [supabase, loadTrackHistory]);

  const removeStationFromHistory = useCallback(
    async (id: string) => {
      if (!id) return;
      await supabase.from('listen_history').delete().eq('station_id', id);
      loadStationHistory();
    },
    [supabase, loadStationHistory]
  );

  const clearStationHistory = useCallback(async () => {
    await supabase.from('listen_history').delete().neq('station_id', '00000000-0000-0000-0000-000000000000');
    loadStationHistory();
  }, [supabase, loadStationHistory]);

  return (
    <NowPlayingContext.Provider
      value={{
        station,
        stationMetadata,
        matchedTrack,
        songHistory,
        stationHistory,
        removeSongFromHistory,
        clearSongHistory,
        removeStationFromHistory,
        clearStationHistory,
      }}
    >
      {children}
    </NowPlayingContext.Provider>
  );
}
