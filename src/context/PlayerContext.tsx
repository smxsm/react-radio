import Hls from 'hls.js';
import { createContext, PropsWithChildren, useEffect, useRef, useState } from 'react';

export type PlayerContextType = {
  station?: RadioStation;
  status: PlayerStatus;
  play: (station: RadioStation) => void;
  stop: () => void;
  audioContext?: AudioContext;
  sourceNode?: AudioNode;
};

type PlayerStatus = 'error' | 'loading' | 'playing' | 'stopped';

type PlayerProviderProps = PropsWithChildren & {};

export const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: PlayerProviderProps) {
  const audioElementRef = useRef(new Audio());
  const audioElement2Ref = useRef(new Audio());
  const hlsRef = useRef(new Hls());
  const audioContextRef = useRef(new AudioContext());
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode>();

  const [station, setStation] = useState<RadioStation>();
  const [status, setStatus] = useState<PlayerStatus>('stopped');
  const [sourceNode, setSourceNode] = useState<AudioNode>();

  useEffect(() => {
    audioSourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioElementRef.current);
    audioSourceNodeRef.current.connect(audioContextRef.current.destination);
    setSourceNode(audioSourceNodeRef.current);
  }, []);

  audioElementRef.current.crossOrigin = 'anonymous';

  const resetAudioElements = () => {
    audioElementRef.current.src = '';
    audioElement2Ref.current.src = '';
    audioElementRef.current.load();
    audioElement2Ref.current.load();
  };

  const stop = () => {
    hlsRef.current.stopLoad();
    hlsRef.current.detachMedia();
    resetAudioElements();
    setStatus('stopped');
  };

  const play = (station: RadioStation) => {
    stop();
    setStation(station);
    setStatus('loading');

    audioElementRef.current.src = station.listenUrl;
    // Try playing the stream
    audioElementRef.current
      .play()
      .then(() => {
        setStatus('playing');
      })
      .catch(() => {
        // Playback failed. Maybe CORS issue. Try playing outside the Audio Context.
        audioElement2Ref.current.src = station.listenUrl;
        audioElement2Ref.current
          .play()
          .then(() => setStatus('playing'))
          .catch(() => {
            // Still failing. Maybe it is a HLS stream. Try playing it using hls.js.
            resetAudioElements();
            hlsRef.current.loadSource(station.listenUrl);
            hlsRef.current.attachMedia(audioElementRef.current);
            audioElementRef.current
              .play()
              .then(() => {
                setStatus('playing');
              })
              .catch(() => {
                // All playback attempts failed.
                setStatus('error');
              });
          });
      });
  };

  return (
    <PlayerContext.Provider value={{ station, status, play, stop, audioContext: audioContextRef.current, sourceNode }}>
      {children}
    </PlayerContext.Provider>
  );
}
