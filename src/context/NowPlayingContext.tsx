import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import { PlayerContext } from './PlayerContext';

type NowPlayingContextType = {
  station?: RadioStation;
  stationMetadata?: StationMetadata;
  trackMatch?: TrackInfo;
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
  artist: string;
  title: string;
  album: string;
  releaseDate: Date | null;
  artwork: string;
  appleMusicUrl?: string;
  youTubeUrl?: string;
};

type NowPlayingInfoProviderProps = PropsWithChildren & {};

/**
 * Gets music track metadata from iTunes API.
 * @param searchTerm The text to search. Will filter special symbols and terms like ft, feat, vs
 * @returns Returns a Promise resolving to a TrackInfo object or null. Doesn't throw.
 */
// const matchTrack = async (searchTerm: string): Promise<TrackInfo | null> => {
//   try {
//     const filterTerms = ['ft', 'feat', 'vs'];
//     const cleanedSearchTerm = searchTerm
//       .match(/\w+(?![^(]*\))/g)
//       ?.filter((term) => !filterTerms.includes(term.toLowerCase()))
//       .join(' ');
//     if (!cleanedSearchTerm) {
//       return null;
//     }
//     const res = await fetch(`https://itunes.apple.com/search?term=${cleanedSearchTerm}&entity=musicTrack`);
//     const data = await res.json();
//     if (!data.resultCount) {
//       return null;
//     }
//     // TODO Implement some kind of matching algorithm instead of taking the first result
//     return {
//       artist: data.results[0].artistName || '',
//       title: data.results[0].trackName || '',
//       album: data.results[0].collectionName || '',
//       releaseDate: new Date(data.results[0].releaseDate) || null,
//       artwork: data.results[0].artworkUrl100,
//     };
//   } catch (err) {
//     return null;
//   }
// };

/**
 * Gets metadata for a radio stream from a free internet service
 * @param url The original stream URL
 * @returns A Promise whose resolved value is a StationMetadata object. Throws on error.
 */
const getStationMetadata = async (url: string): Promise<StationMetadata> => {
  const res = await fetch('https://radio.ivanoff.dev/station-metadata?url=' + url);
  const data = await res.json();
  return data;
};

export const NowPlayingContext = createContext<NowPlayingContextType | null>(null);

export function NowPlayingProvider({ children }: NowPlayingInfoProviderProps) {
  const playerContext = useContext(PlayerContext);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingContextType>({});
  const intervalRef = useRef<NodeJS.Timer | number>(0);

  useEffect(() => {
    // let matchedTrack = '';
    const getNowPlayingInfo = async (url: string | undefined) => {
      if (!url) return;
      try {
        const stationMetadata = await getStationMetadata(url);
        const newState: NowPlayingContextType = { stationMetadata };
        // if (stationMetadata.title && stationMetadata.title !== matchedTrack) {
        //   newState.trackMatch = (await matchTrack(stationMetadata.title)) || undefined;
        //   matchedTrack = stationMetadata.title;
        // }
        setNowPlaying((state) => ({ ...state, ...newState }));
      } catch (err) {}
    };

    clearInterval(intervalRef.current);

    if (playerContext?.status === 'stopped' || playerContext?.status === 'error') {
      setNowPlaying({});
      return;
    }

    setNowPlaying({ station: playerContext?.station });

    if (playerContext?.status === 'playing') {
      getNowPlayingInfo(playerContext.station?.listenUrl);
      intervalRef.current = setInterval(() => getNowPlayingInfo(playerContext.station?.listenUrl), 5000);
    }

    return () => clearInterval(intervalRef.current);
  }, [playerContext?.station, playerContext?.status]);

  return <NowPlayingContext.Provider value={nowPlaying}>{children}</NowPlayingContext.Provider>;
}
