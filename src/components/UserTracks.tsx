import { useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { UserContext } from '../context/UserContext';
import { DocumentTitleContext } from '../context/DocumentTitleContext';
import { NowPlayingContext } from '../context/NowPlayingContext';
import CardsList from './ui/CardsList';
import Card from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import CustomStationsListOptions from './CustomStationsListOptions';

import styles from './UserTracks.module.css';

export default function UserTracks() {
  const [searchParams] = useSearchParams();
  const { sort, order } = Object.fromEntries(searchParams.entries());
  const { user } = useContext(UserContext)!;
  const { getUserTracks, deleteUserTrack, userTracks: tracks, userTracksLoading, clearUserTracks } = useContext(NowPlayingContext)!;
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;
  const { t } = useTranslation();
  const translate = t as (key: string) => string;

  useEffect(() => {
    setDocumentTitle(translate('user.mytracks'));
  }, [setDocumentTitle, translate]);

  // Initial fetch and route change handler
  useEffect(() => {
    getUserTracks('', sort, order !== 'desc');
  }, [user, getUserTracks, sort, order]);

  const deleteHandler = (id: string, title: string) =>
    window.confirm(`${translate('info.track.delete')} ${title}?`) &&
    deleteUserTrack(id).then(() => getUserTracks('', sort, order !== 'desc'));
  const clearHandler = () =>
    window.confirm(`${translate('info.track.deleteall')}?`) &&
    clearUserTracks().then(() => getUserTracks('', sort, order !== 'desc'));

  if (userTracksLoading) {
    return <Spinner className={styles.spinner} />;
  }

  return (
    <section className={styles.section}>
      <div className={styles.optionsContaienr}>
        <CustomStationsListOptions />
      </div>
      <div className={styles.userTracksTitleContainer}>
        <h3 className={styles.recommendedTitle}>{translate('user.mytracks')}</h3>
        <Button
          type="button"
          disabled={!tracks?.length}
          className={styles.btnClear}
          onClick={() => clearHandler()}
        >
          {translate('general.clear')}
        </Button>
      </div>

      <CardsList className={styles.cardsList}>
        {tracks?.map((entry) => (
          <Card key={entry.id} className={styles.userTracksCard}>
            <figure>
              <img src={entry.artwork ?? undefined} alt="Song artwork" />
            </figure>
            <div className={styles.userTracksTrackInfo}>
              <p className={styles.userTracksCardTitle}>{entry.title}</p>
              <p className={styles.userTracksCardArtist}>{entry.artist}</p>
              <p className={styles.userTracksCardDate}>
                {entry.createdAt && new Date(entry.createdAt).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })}
              </p>
            </div>
            <div className={styles.actions}>
              <FontAwesomeIcon
                icon={faTrashAlt}
                className={styles.actionIcon}
                title={`Remove`}
                onClick={() => deleteHandler(entry.id, entry.title)}
              />
            </div>
            <div className={styles.streamLinks}>
              {entry.spotifyUrl && (
                <a target="_blank" rel="noreferrer" href={entry.spotifyUrl}>
                  <img src="/spotify.svg" alt="Spotify" className={styles.streamLink} />
                </a>
              )}
              {entry.appleMusicUrl && (
                <a target="_blank" rel="noreferrer" href={entry.appleMusicUrl}>
                  <img src="/apple-music.svg" alt="Apple Musc" className={styles.streamLink} />
                </a>
              )}
              {entry.youTubeUrl && (
                <a target="_blank" rel="noreferrer" href={entry.youTubeUrl}>
                  <img src="/youtube.png" alt="Apple Musc" className={styles.streamLink} />
                </a>
              )}
            </div>
          </Card>
        ))}
      </CardsList>
    </section>
  );
}
