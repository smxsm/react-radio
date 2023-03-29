import { useContext } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PlayerContext } from '../context/PlayerContext';
import { useStations } from '../hooks/useStations';
import Pagination from './Pagination';
import Card from './ui/Card';
import CardsList from './ui/CardsList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-regular-svg-icons';

import styles from './StationsCardList.module.css';
import Spinner from './ui/Spinner';
import StationsListOptions from './StationsListOptions';
import RadioStationCard from './RadioStationCard';

interface RadioStation {
  id: string;
  name: string;
  logo: string;
  listenUrl: string;
}

const parseSearchParams = ({ limit, offset, sort, order }: any) => ({
  limit: Number(limit) || 40,
  offset: Number(offset) || 0,
  sort: sort || 'popularity',
  order: order || 'desc',
});

export default function StationsCardList() {
  const filter = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsState = parseSearchParams(Object.fromEntries(searchParams.entries()));
  const { totalCount, stations, loading } = useStations(filter, searchParamsState);
  const playerContext = useContext(PlayerContext);

  const pageChangeHandler = (page: number) => {
    const nextOffset = (page - 1) * searchParamsState.limit + '';
    setSearchParams({ ...(searchParamsState as any), offset: nextOffset });
  };

  const playHandler = (station: RadioStation) => playerContext?.play(station);

  if (loading && !stations.length) {
    return <Spinner className={styles.spinner} />;
  }

  return (
    <div className={styles.container}>
      <StationsListOptions />
      <CardsList className={styles.cardsList}>
        {stations.map((station, i) => (
          <RadioStationCard disabled={loading} station={station} key={i + station.listenUrl} onPlay={playHandler} />
        ))}
      </CardsList>

      {totalCount > searchParamsState.limit && (
        <Pagination
          pages={Math.ceil(totalCount / searchParamsState.limit)}
          current={Math.floor(searchParamsState.offset / searchParamsState.limit + 1)}
          className={styles.pagination}
          onPageChange={pageChangeHandler}
        ></Pagination>
      )}
    </div>
  );
}
