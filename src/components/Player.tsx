import styles from './Player.module.css';

import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStepBackward, faPlay, faStepForward, faStop } from '@fortawesome/free-solid-svg-icons';
import SpectrumAnalyzer from './SpectrumAnalyzer';
import ScrollingText from './ui/ScrollingText';
import { PlayerContext } from '../context/PlayerContext';
import { NowPlayingContext } from '../context/NowPlayingContext';

export default function Player(props: any) {
  const playerContext = useContext(PlayerContext)!;
  const { station, stationMetadata, matchedTrack } = useContext(NowPlayingContext)!;

  let classes = styles.player;
  if (playerContext?.status === 'loading') classes += ' ' + styles.loading;
  if (playerContext?.status === 'error') classes += ' ' + styles.error;
  if (playerContext?.status === 'playing') classes += ' ' + styles.active;

  return (
    <div className={classes}>
      <div className={styles.currentTrack}>
        <img
          src={matchedTrack?.artwork.replace('100x100', '600x600') || station?.logo || '/sound-wave.png'}
          alt=""
          className={styles.artwork}
        />

        <SpectrumAnalyzer
          source={playerContext?.sourceNode}
          audioCtx={playerContext?.audioContext}
          className={styles.visualizer}
        />

        <div className={styles.trackInfo}>
          <ScrollingText text={stationMetadata?.icyName || station?.name || ''} className={styles.stationName} />
          <ScrollingText
            text={
              `${matchedTrack?.artist ? matchedTrack.artist + ' - ' : ''}${matchedTrack?.title || ''}` ||
              stationMetadata?.title ||
              '-'
            }
            className={styles.trackTitle}
          />
        </div>

        <div className={styles['media-controls']}>
          <div className={styles['button-container']}>
            <button
              className={`${styles['media-button']} ${playerContext.queue.length < 2 ? styles.disabled : ''}`.trim()}
              onClick={() => playerContext.previous()}
            >
              <FontAwesomeIcon icon={faStepBackward} className={styles['media-button-icon']} />
            </button>
            <button
              className={`${styles['media-button']} ${styles['media-button-play']}`}
              onClick={() => (playerContext.status !== 'stopped' ? playerContext.stop() : playerContext.play())}
            >
              {playerContext.status === 'stopped' && (
                <FontAwesomeIcon icon={faPlay} className={styles['media-button-icon']} />
              )}
              {playerContext.status !== 'stopped' && (
                <FontAwesomeIcon icon={faStop} className={styles['media-button-icon']} />
              )}
            </button>
            <button
              className={`${styles['media-button']} ${playerContext.queue.length < 2 ? styles.disabled : ''}`.trim()}
              onClick={() => playerContext.next()}
            >
              <FontAwesomeIcon icon={faStepForward} className={styles['media-button-icon']} />
            </button>
          </div>
        </div>

        <div className={styles.musicLinks}>
          {matchedTrack?.appleMusicUrl && (
            <a target="_blank" rel="noreferrer" href={matchedTrack.appleMusicUrl} onClick={() => playerContext?.stop()}>
              <img src="/apple-music.svg" alt="Apple Musc" />
            </a>
          )}
          {matchedTrack?.youTubeUrl && (
            <a target="_blank" rel="noreferrer" href={matchedTrack.youTubeUrl} onClick={() => playerContext?.stop()}>
              <img src="/youtube.png" alt="Apple Musc" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
