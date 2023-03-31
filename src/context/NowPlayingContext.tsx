import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import useSupabase from '../hooks/useSupabase';
import { PlayerContext } from './PlayerContext';

type NowPlayingContextType = {
  station?: RadioStation;
  stationMetadata?: StationMetadata;
  matchedTrack?: TrackInfo;
  history?: TrackInfo[];
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
  status: 'playing' | 'history';
  heardAt: Date;
};

type NowPlayingInfoProviderProps = PropsWithChildren & {};

export const NowPlayingContext = createContext<NowPlayingContextType | null>(null);

export function NowPlayingProvider({ children }: NowPlayingInfoProviderProps) {
  const supabase = useSupabase();
  const playerContext = useContext(PlayerContext);
  const [station, setStation] = useState<RadioStation | undefined>();
  const [stationMetadata, setStationMetadata] = useState<StationMetadata | undefined>();
  const [matchedTrack, setMatchedTrack] = useState<TrackInfo | undefined>();
  const [history, setHistory] = useState<TrackHistory[]>([]);
  const intervalRef = useRef<NodeJS.Timer | number>(0);
  const abortControllerRef = useRef(new AbortController());

  // Get station metadata on interval
  useEffect(() => {
    const getNowPlayingInfo = async (url: string | undefined) => {
      if (!url) return;
      try {
        abortControllerRef.current = new AbortController();
        const res = await fetch('https://radio.ivanoff.dev/station-metadata?url=' + url, {
          signal: abortControllerRef.current.signal,
        });
        const stationMetadata = await res.json();
        setMatchedTrack({
          ...stationMetadata.trackMatch,
          releaseDate: new Date(stationMetadata.trackMatch.releaseDate),
        });
        delete stationMetadata.trackMatch;
        setStationMetadata(stationMetadata);
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
      .then(() =>
        supabase
          .from('tracks_history')
          .select('*, track_match (id, artist, title, album, artwork, release_date)')
          .order('created_at', { ascending: false })
          .limit(100)
      )
      .then(({ data, error }) => {
        if (error) throw error;
        return data.map<TrackHistory>((entry) => ({
          heardAt: new Date(entry.created_at),
          status: entry.track_id === matchedTrack?.id ? 'playing' : 'history',
          id: entry.track_match.id,
          artist: entry.track_match.artist,
          title: entry.track_match.title,
          album: entry.track_match.album,
          releaseDate: new Date(entry.track_match.release_date),
          artwork: entry.track_match.artwork,
        }));
      })
      .then(setHistory);
  }, [supabase, matchedTrack?.id]);

  return (
    <NowPlayingContext.Provider value={{ station, stationMetadata, matchedTrack, history }}>
      {children}
    </NowPlayingContext.Provider>
  );
}
