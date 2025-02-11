import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { PlayerContext } from './PlayerContext';
import { NowPlayingContext } from './NowPlayingContext';

type DocumentTitleContextType = {
  setDocumentTitle: (title: string) => void;
};

type DocumentTitleProviderProps = PropsWithChildren & {};

type LocationTitle = {
  [key: string]: string;
};

export const DocumentTitleContext = createContext<DocumentTitleContextType | null>(null);

export function DocumentTitleProvider({ children }: DocumentTitleProviderProps) {
  const [locationTitle, setLocationTitle] = useState<LocationTitle>({});
  const { status } = useContext(PlayerContext) || {};
  const { station, stationMetadata, matchedTrack } = useContext(NowPlayingContext) || {};
  const locationKey = useLocation().key;

  useEffect(() => {
    const title = locationTitle[locationKey];
    let newTitle = (title && `${title} | Radio Hero`) || 'Radio Hero';
    if (status === 'playing') {
      const stationName = stationMetadata?.icyName || station?.name;
      if (matchedTrack?.artist && matchedTrack.title) {
        newTitle += ` - Playing ${matchedTrack.title} by ${matchedTrack.artist} on ${stationName}`;
      } else {
        newTitle += ` - Playing ${stationName}`;
      }
    }

    document.title = newTitle;
  }, [
    locationTitle,
    locationKey,
    status,
    station?.name,
    stationMetadata?.icyName,
    matchedTrack?.artist,
    matchedTrack?.title,
  ]);

  const setDocumentTitle = useCallback((title: string) => setLocationTitle({ [locationKey]: title }), [locationKey]);

  return <DocumentTitleContext.Provider value={{ setDocumentTitle }}>{children}</DocumentTitleContext.Provider>;
}
