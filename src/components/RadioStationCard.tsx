import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { faPencil, faPlay, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { PlayerContext } from '../context/PlayerContext';
import Card from './ui/Card';
import styles from './RadioStationCard.module.css';

type RadioStationCardProps = {
  station: RadioStation;
  disabled?: boolean;
  onPlay?: (station: RadioStation) => void;
  onEdit?: (station: RadioStation) => void;
  onDelete?: (station: RadioStation) => void;
};

export default function RadioStationCard({ station, disabled, onPlay, onEdit, onDelete }: RadioStationCardProps) {
  const playerContext = useContext(PlayerContext)!;

  return (
    <Card
      disabled={disabled}
      loading={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'loading'}
      active={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'playing'}
      error={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'error'}
      className={styles.card}
    >
      <figure>
        <img src={station.logo ? station.logo : '/radio-no-logo.png'} alt="" className={styles['card-img']} />
        {onPlay && <FontAwesomeIcon icon={faPlay} className={styles.btnPlay} onClick={() => onPlay(station)} />}
      </figure>

      <Link to={station.id} className={styles.title}>
        {station.name}
      </Link>

      <div className={styles.actions}>
        <FontAwesomeIcon icon={faHeart} className={styles.actionIcon} />
        {station.isOwner && onEdit && (
          <FontAwesomeIcon icon={faPencil} className={styles.actionIcon} onClick={() => onEdit(station)} />
        )}
        {station.isOwner && onDelete && (
          <FontAwesomeIcon icon={faX} className={styles.actionIcon} onClick={() => onDelete(station)} />
        )}
      </div>
    </Card>
  );
}
