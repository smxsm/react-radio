import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { PlayerContext } from './PlayerContext';
import { UserContext } from './UserContext';
import { useHistory } from '../hooks/useHistory';
import { TrackInfo, RadioStation } from '../lib/api';
import useUserTracks from '../hooks/useUserTracks';

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
  userTracks?: TrackInfo[];
  userTracksLoading?: boolean;
  userTracksError?: Error | null;
  removeSongFromHistory: (id: string) => Promise<void>;
  addSongToTracks: (id: string, stationId: string) => Promise<void>;
  clearSongHistory: () => Promise<void>;
  removeStationFromHistory: (id: string) => Promise<void>;
  clearStationHistory: () => Promise<void>;
  getUserTracks: (id?: string, sort?: string, ascending?: boolean, limit?: number) => Promise<void>;
  clearUserTracks: () => Promise<void>;
  deleteUserTrack: (id: string) => Promise<void>;
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
  const { getUserTracks: getTracksFromHook, addUserTrack, deleteUserTrack, tracks: userTracks, loading: userTracksLoading, error: userTracksError, clearUserTracks } = useUserTracks(); 

  const [station, setStation] = useState<RadioStation | undefined>();
  const [stationMetadata, setStationMetadata] = useState<StationMetadata | undefined>();
  const [matchedTrack, setMatchedTrack] = useState<TrackInfo | undefined>();
  const intervalRef = useRef<NodeJS.Timer | number>(0);
  const abortControllerRef = useRef(new AbortController());
  const lastAddedTrackRef = useRef<string | null>();

  const loadTrackHistory = useCallback(async () => {
    if (!user) return;
    await getTrackHistory();
  }, [user, getTrackHistory]);

  const getUserTracks = useCallback(
    async (id = '', sort = 'created_at', ascending = true, limit = 50) => {
      if (!user) return;
      await getTracksFromHook(id, sort, ascending, limit);
    },
    [user, getTracksFromHook]
  );

  // Initial load of user tracks
  const refreshUserTracks = useCallback(async () => {
    if (!user) return;
    await getUserTracks();
  }, [user, getUserTracks]);

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
        const result = await res.json();
        setStationMetadata(result.stationMetadata);
        if (!result.matchedTrack) {
          return setMatchedTrack(undefined);
        }
        setMatchedTrack({
          ...result.matchedTrack,
          releaseDate: new Date(result.matchedTrack.releaseDate),
          stationId: playerContext?.station?.stationId,
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
      intervalRef.current = setInterval(() => getNowPlayingInfo(playerContext.station?.listenUrl), 15000);
    }

    return () => clearInterval(intervalRef.current);
  }, [playerContext?.station, playerContext?.status, station?.listenUrl]);

  // Add matched track to history only if it's different from the last added track
  useEffect(() => {
    if (!user || !matchedTrack?.id) return;
    // save artwork to identify if already added to history
    if (lastAddedTrackRef.current !== matchedTrack.artwork) {
      lastAddedTrackRef.current = matchedTrack.artwork;
      addTrackToHistory(matchedTrack).then(loadTrackHistory);
    }
  }, [user, matchedTrack, addTrackToHistory, loadTrackHistory]);

  useEffect(() => {
    if (!user) return;
    loadStationHistory();
    refreshUserTracks();
    loadTrackHistory();
  }, [user, loadStationHistory, loadTrackHistory, refreshUserTracks]);

  const addSongToTracks = useCallback(
    async (id: string, stationId: string = '') => {
      if (!user || !id) return;
      await addUserTrack(id, stationId);
      await refreshUserTracks(); // Refresh the tracks list after adding
    },
    [user, addUserTrack, refreshUserTracks]
  );
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
        userTracks,
        userTracksLoading,
        userTracksError,
        removeSongFromHistory,
        addSongToTracks,
        clearSongHistory: clearSongHistoryHandler,
        removeStationFromHistory,
        clearStationHistory: clearStationHistoryHandler,
        getUserTracks,
        clearUserTracks,
        deleteUserTrack
      }}
    >
      {children}
    </NowPlayingContext.Provider>
  );
}
