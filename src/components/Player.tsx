import styles from './Player.module.css';

import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStepBackward, faPlay, faStepForward } from '@fortawesome/free-solid-svg-icons';
import SpectrumAnalyzer from './SpectrumAnalyzer';
import ScrollingText from './ui/ScrollingText';
import { PlayerContext } from '../context/PlayerContext';
import { NowPlayingContext } from '../context/NowPlayingContext';
import Card from './ui/Card';

export default function Player(props: any) {
  const playerContext = useContext(PlayerContext)!;
  const { station, stationMetadata, matchedTrack, history } = useContext(NowPlayingContext)!;

  let classes = styles.player;
  if (playerContext?.status === 'loading') classes += ' ' + styles.loading;
  if (playerContext?.status === 'error') classes += ' ' + styles.error;
  if (playerContext?.status === 'playing') classes += ' ' + styles.active;

  return (
    <div className={classes}>
      <div className={styles['now-playing-container']}>
        <div className={styles['now-playing-info']}>
          <ScrollingText text={stationMetadata?.icyName || station?.name || ''} className={styles['radio-name']} />
          <ScrollingText text={stationMetadata?.title || ''} className={styles['track-name']} />
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

      <img
        src={matchedTrack?.artwork.replace('100x100', '600x600') || station?.logo || '/radio-no-logo.png'}
        alt=""
        className={styles.artwork}
      />

      <div className={styles.trackInfo}>
        {matchedTrack && (
          <>
            <ScrollingText text={matchedTrack.title} className={styles.trackTitle} />
            <ScrollingText text={matchedTrack.artist} className={styles.trackArtist} />
            <ScrollingText
              text={`${matchedTrack.album} (${matchedTrack.releaseDate?.getFullYear()})`}
              className={styles.trackAlbum}
            />
          </>
        )}
      </div>

      {matchedTrack && (
        <div className={styles.musicLinks}>
          {matchedTrack.appleMusicUrl && (
            <a target="_blank" rel="noreferrer" href={matchedTrack.appleMusicUrl} onClick={() => playerContext?.stop()}>
              <img src="/apple-music.svg" alt="Apple Musc" />
            </a>
          )}
          {matchedTrack.youTubeUrl && (
            <a target="_blank" rel="noreferrer" href={matchedTrack.youTubeUrl} onClick={() => playerContext?.stop()}>
              <img src="/youtube.png" alt="Apple Musc" />
            </a>
          )}
        </div>
      )}

      {history && (
        <div className={styles.history}>
          {history.map((entry) =>
            entry.status === 'playing' ? null : (
              <Card key={entry.id} className={styles.historyCard}>
                <figure>
                  <img src={entry.artwork}></img>
                </figure>
                <div className={styles.historyTrackInfo}>
                  <p className={styles.historyCardTitle}>{entry.title}</p>
                  <p className={styles.historyCardTitle}>{entry.artist}</p>
                </div>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
