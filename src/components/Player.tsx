import styles from './Player.module.css';

import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStepBackward, faPlay, faStepForward } from '@fortawesome/free-solid-svg-icons';
import SpectrumAnalyzer from './SpectrumAnalyzer';
import ScrollingText from './ui/ScrollingText';
import { PlayerContext } from '../context/PlayerContext';
import { NowPlayingContext } from '../context/NowPlayingContext';

export default function Player(props: any) {
  const playerContext = useContext(PlayerContext)!;
  const nowPlaying = useContext(NowPlayingContext)!;

  let classes = styles.player;
  if (playerContext?.status === 'loading') classes += ' ' + styles.loading;
  if (playerContext?.status === 'error') classes += ' ' + styles.error;
  if (playerContext?.status === 'playing') classes += ' ' + styles.active;

  return (
    <div className={classes}>
      <div className={styles['now-playing-container']}>
        <img
          src={nowPlaying.stationMetadata?.trackMatch?.artwork || nowPlaying.station?.logo || '/radio-no-logo.png'}
          alt=""
        />
        <div className={styles['now-playing-info']}>
          <ScrollingText
            text={nowPlaying?.stationMetadata?.icyName || nowPlaying.station?.name || ''}
            className={styles['radio-name']}
          />
          <ScrollingText text={nowPlaying?.stationMetadata?.title || ''} className={styles['track-name']} />
          {nowPlaying.stationMetadata?.trackMatch && (
            <div className={styles.musicLinks}>
              {nowPlaying.stationMetadata.trackMatch.appleMusicUrl && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={nowPlaying.stationMetadata?.trackMatch?.appleMusicUrl}
                  onClick={() => playerContext?.stop()}
                >
                  <img src="/apple-music.svg" alt="Apple Musc" />
                </a>
              )}
              {nowPlaying.stationMetadata.trackMatch.youTubeUrl && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={nowPlaying.stationMetadata?.trackMatch?.youTubeUrl}
                  onClick={() => playerContext?.stop()}
                >
                  <img src="/youtube.png" alt="Apple Musc" />
                </a>
              )}
            </div>
          )}
        </div>

        <SpectrumAnalyzer
          source={playerContext?.sourceNode}
          audioCtx={playerContext?.audioContext}
          className={styles.visualizer}
        />
      </div>

      <div className={styles['media-controls']}>
        <div className={styles['button-container']}>
          <button className={styles['media-button']} onClick={() => playerContext.previous()}>
            <FontAwesomeIcon icon={faStepBackward} className={styles['media-button-icon']} />
          </button>
          <button
            className={`${styles['media-button']} ${styles['media-button-play']}`}
            onClick={() => (playerContext.status !== 'stopped' ? playerContext.stop() : playerContext.play())}
          >
            <FontAwesomeIcon icon={faPlay} className={styles['media-button-icon']} />
          </button>
          <button className={styles['media-button']} onClick={() => playerContext.next()}>
            <FontAwesomeIcon icon={faStepForward} className={styles['media-button-icon']} />
          </button>
        </div>
      </div>
    </div>
  );
}
