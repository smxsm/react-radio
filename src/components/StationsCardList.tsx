import { useContext, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { PlayerContext } from '../context/PlayerContext';
import { DocumentTitleContext } from '../context/DocumentTitleContext';
import { useStations } from '../hooks/useStations';
import useCustomStations from '../hooks/useCustomStations';

import Spinner from './ui/Spinner';
import CardsList from './ui/CardsList';
import Pagination from './Pagination';
import StationsListOptions from './StationsListOptions';
import RadioStationCard from './RadioStationCard';

import styles from './StationsCardList.module.css';

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
  const { totalCount, stations, loading: loadingStations } = useStations(filter, searchParamsState);
  const playerContext = useContext(PlayerContext);
  const { addCustomStation, getCustomStations, loading: addingCustomStation } = useCustomStations();
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;

  useEffect(() => {
    setDocumentTitle('Browse stations');
  }, [setDocumentTitle]);

  const loading = loadingStations || addingCustomStation;

  const playHandler = (station: RadioStation) => playerContext?.play([station]);

  const addHandler = (station: RadioStation) =>
    getCustomStations(station.id)
      .then((result) =>
        result.length
          ? window.confirm(`${station.name} is already in your library. Are you sure you want to replace it?`)
          : true
      )
      .then((result) => (result ? addCustomStation(station) : false));

  const pageChangeHandler = (page: number) => {
    const nextOffset = (page - 1) * searchParamsState.limit + '';
    setSearchParams({ ...(searchParamsState as any), offset: nextOffset });
  };

  if (loading && !stations.length) {
    return <Spinner className={styles.spinner} />;
  }

  return (
    <div className={styles.container}>
      <StationsListOptions />
      <CardsList className={styles.cardsList}>
        {stations.map((station, i) => (
          <RadioStationCard
            disabled={loading}
            station={station}
            key={i + station.listenUrl}
            onPlay={playHandler}
            onAdd={addHandler}
          />
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
