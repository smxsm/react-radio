import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import useCustomStations from '../hooks/useCustomStations';
import Card from './ui/Card';
import CardsList from './ui/CardsList';
import Button from './ui/Button';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Navigate, useNavigate } from 'react-router-dom';

import styles from './CustomStations.module.css';
import { UserContext } from '../context/UserContext';

export default function CustomStation() {
  const { user, loading: userLoading } = useContext(UserContext)!;
  const { stations, loading } = useCustomStations();
  const playerContext = useContext(PlayerContext);
  const navigate = useNavigate();

  const clickHandler = (station: RadioStation) => () => {
    if (playerContext) {
      playerContext.play(station);
    }
  };

  if (!user && !userLoading) {
    return <Navigate to="/" />;
  }

  return (
    <section className={styles.section}>
      <Button className={styles.btnAdd} onClick={() => navigate('/stations/custom/add')}>
        <FontAwesomeIcon icon={faPlus} />
        Add
      </Button>
      <CardsList className={styles.cardsList}>
        {stations.map((station, i) => (
          <Card
            disabled={loading}
            loading={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'loading'}
            active={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'playing'}
            error={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'error'}
            onClick={clickHandler(station)}
            key={i + station.listenUrl}
          >
            <figure>
              <img
                src={!loading && station.logo ? station.logo : '/radio-no-logo.png'}
                alt=""
                className={styles['card-img']}
              />
            </figure>
            <p className={styles['card-title']}>{station.name}</p>
            <FontAwesomeIcon icon={faHeart} className={styles['icon-favorite']} />
          </Card>
        ))}
      </CardsList>
    </section>
  );
}
