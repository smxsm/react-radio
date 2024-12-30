import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStepBackward, faPlay, faStepForward, faStop, faPlus } from '@fortawesome/free-solid-svg-icons';

import { PlayerContext } from '../context/PlayerContext';
import { NowPlayingContext } from '../context/NowPlayingContext';

import ScrollingText from './ui/ScrollingText';
import SpectrumAnalyzer from './SpectrumAnalyzer';

import styles from './Player.module.css';

export default function Player(props: any) {
  const playerContext = useContext(PlayerContext)!;
  const { station, stationMetadata, matchedTrack, addSongToTracks } = useContext(NowPlayingContext)!;

  let classes = styles.player;
  if (playerContext?.status === 'loading') classes += ' ' + styles.loading;
  if (playerContext?.status === 'error') classes += ' ' + styles.error;
  if (playerContext?.status === 'playing') classes += ' ' + styles.active;

  return (
    <div className={classes}>
      <img
        src={matchedTrack?.artwork?.replace('100x100', '600x600') || station?.logo || '/sound-wave.png'}
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
            onClick={() =>
              playerContext.status === 'playing' || playerContext.status === 'loading'
                ? playerContext.stop()
                : playerContext.play()
            }
          >
            {(playerContext.status === 'stopped' || playerContext.status === 'error') && (
              <FontAwesomeIcon icon={faPlay} className={styles['media-button-icon']} />
            )}
            {(playerContext.status === 'playing' || playerContext.status === 'loading') && (
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
        {matchedTrack?.spotifyUrl && (
          <a target="_blank" rel="noreferrer" href={matchedTrack.spotifyUrl} onClick={() => playerContext?.stop()}>
            <img src="/spotify.svg" alt="Spotify" />
          </a>
        )}
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
        {matchedTrack?.id && (
          <FontAwesomeIcon
            icon={faPlus}
            className={styles.actionIcon}
            title={`Add ${matchedTrack?.title} to your tracks`}
            onClick={async () => {
              try {
                await addSongToTracks(matchedTrack.id);
                // Could add a toast notification here if you have a notification system
                console.log('Player: Track added successfully');
              } catch (error) {
                console.error('Player: Failed to add track:', error);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
