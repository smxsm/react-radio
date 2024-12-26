import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { PlayerContext } from './PlayerContext';
import { UserContext } from './UserContext';
import { useHistory } from '../hooks/useHistory';
import { TrackInfo, RadioStation } from '../lib/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface StationMetadata {
  icyGenre: string[];
  icyAudioInfo: {
    bitRate: number;
    quality: number;
    channels: number;
    sampleRate: number;
  };
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
}

interface NowPlayingContextType {
  station?: RadioStation;
  stationMetadata?: StationMetadata;
  matchedTrack?: TrackInfo;
  stationHistory?: RadioStation[];
  songHistory?: TrackInfo[];
  removeSongFromHistory: (id: string) => Promise<void>;
  clearSongHistory: () => Promise<void>;
  removeStationFromHistory: (id: string) => Promise<void>;
  clearStationHistory: () => Promise<void>;
}

type NowPlayingInfoProviderProps = PropsWithChildren & {};

export const NowPlayingContext = createContext<NowPlayingContextType | null>(null);

export function NowPlayingProvider({ children }: NowPlayingInfoProviderProps) {
  const playerContext = useContext(PlayerContext);
  const { user } = useContext(UserContext) || {};
  const {
    trackHistory: songHistory,
    stationHistory,
    getTrackHistory,
    getStationHistory,
    addTrackToHistory,
    addStationToHistory,
    deleteTrackFromHistory,
    deleteStationFromHistory,
    clearTrackHistory,
    clearStationHistory,
  } = useHistory();

  const [station, setStation] = useState<RadioStation | undefined>();
  const [stationMetadata, setStationMetadata] = useState<StationMetadata | undefined>();
  const [matchedTrack, setMatchedTrack] = useState<TrackInfo | undefined>();
  const intervalRef = useRef<NodeJS.Timer | number>(0);
  const abortControllerRef = useRef(new AbortController());

  const loadTrackHistory = useCallback(async () => {
    if (!user) return;
    await getTrackHistory();
  }, [user, getTrackHistory]);

  const loadStationHistory = useCallback(async () => {
    if (!user) return;
    await getStationHistory();
  }, [user, getStationHistory]);

  // Update played stations history
  useEffect(() => {
    if (!user || playerContext?.status !== 'playing' || !playerContext.station) {
      return;
    }
    addStationToHistory(playerContext.station).then(loadStationHistory);
  }, [playerContext?.station, playerContext?.status, user, addStationToHistory, loadStationHistory]);

  // Get station metadata on interval
  useEffect(() => {
    const getNowPlayingInfo = async (url: string | undefined) => {
      if (!url) return;
      try {
        abortControllerRef.current = new AbortController();
        const res = await fetch(API_BASE_URL + '/station-metadata?url=' + url, {
          signal: abortControllerRef.current.signal,
        });
        console.log('Lookup', res);
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
    if (!user || !matchedTrack?.id) return;
    addTrackToHistory(matchedTrack).then(loadTrackHistory);
  }, [user, matchedTrack?.id, addTrackToHistory, loadTrackHistory]);

  useEffect(() => {
    if (!user) return;
    loadStationHistory();
    loadTrackHistory();
  }, [user, loadStationHistory, loadTrackHistory]);

  const removeSongFromHistory = useCallback(
    async (id: string) => {
      if (!user || !id) return;
      await deleteTrackFromHistory(id);
      await loadTrackHistory();
    },
    [user, deleteTrackFromHistory, loadTrackHistory]
  );

  const clearSongHistoryHandler = useCallback(async () => {
    if (!user) return;
    await clearTrackHistory();
    await loadTrackHistory();
  }, [user, clearTrackHistory, loadTrackHistory]);

  const removeStationFromHistory = useCallback(
    async (id: string) => {
      if (!user || !id) return;
      await deleteStationFromHistory(id);
      await loadStationHistory();
    },
    [user, deleteStationFromHistory, loadStationHistory]
  );

  const clearStationHistoryHandler = useCallback(async () => {
    if (!user) return;
    await clearStationHistory();
    await loadStationHistory();
  }, [user, clearStationHistory, loadStationHistory]);

  return (
    <NowPlayingContext.Provider
      value={{
        station,
        stationMetadata,
        matchedTrack,
        songHistory,
        stationHistory,
        removeSongFromHistory,
        clearSongHistory: clearSongHistoryHandler,
        removeStationFromHistory,
        clearStationHistory: clearStationHistoryHandler,
      }}
    >
      {children}
    </NowPlayingContext.Provider>
  );
}
