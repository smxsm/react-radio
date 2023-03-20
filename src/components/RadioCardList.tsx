import { useContext, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PlayerContext } from '../context/PlayerContext';
import { useStations } from '../hooks';
import Pagination from './Pagination';
import styles from './RadioCardList.module.css';
import Card from './ui/Card';
import CardsList from './ui/CardsList';

interface RadioStation {
  id: string;
  name: string;
  logo: string;
  listenUrl: string;
}

export default function RadioCardList() {
  const { category, value } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [options, setOptions] = useState({
    limit: searchParams.get('limit') || '40',
    offset: searchParams.get('offset') || '0',
    order: searchParams.get('order') || 'desc',
    sort: searchParams.get('sort') || 'trending',
  });
  const playerContext = useContext(PlayerContext);
  const {
    data: { totalCount, stations },
    loading,
  } = useStations(
    { category, value },
    {
      limit: +options.limit || 0,
      offset: +options.offset || 0,
      sort: options.sort,
      order: options.order,
    }
  );

  const offset = +options.offset || 0;
  const limit = +options.limit || 0;

  useEffect(() => {
    document.title = `Radio Stations (${value})`;
  }, [value]);

  useEffect(() => {
    setOptions({
      limit: searchParams.get('limit') || '40',
      offset: searchParams.get('offset') || '0',
      order: searchParams.get('order') || 'desc',
      sort: searchParams.get('sort') || 'trending',
    });
  }, [searchParams]);

  const clickHandler = (station: RadioStation) => () => {
    if (!playerContext) {
      return;
    }
    playerContext.play(station);
  };

  const optionsChangeHandler = (e: any) =>
    setSearchParams({ ...options, [e.target.name]: e.target.value, offset: '0' });
  const pageChangeHandler = (page: number) => setSearchParams({ ...options, offset: (page - 1) * limit + '' });

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <div className={styles['options']}>
        <div className={styles['form-group']}>
          <label htmlFor="sort">Sort by</label>
          <select name="sort" id="sort" value={options.sort} onChange={optionsChangeHandler}>
            <option value="name">Name</option>
            <option value="popularity">Popular</option>
            <option value="trending">Trending</option>
          </select>
        </div>
        <div className={styles['form-group']}>
          <label htmlFor="order">Order</label>
          <select name="order" id="order" value={options.order} onChange={optionsChangeHandler}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <div className={styles['form-group']}>
          <label htmlFor="limit">Limit</label>
          <select name="limit" id="limit" value={options.limit} onChange={optionsChangeHandler}>
            <option value="20">20</option>
            <option value="40">40</option>
            <option value="60">60</option>
            <option value="80">80</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <CardsList>
        {stations.map((station, i) => (
          <Card
            loading={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'loading'}
            active={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'playing'}
            error={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'error'}
            onClick={clickHandler(station)}
            key={i + station.listenUrl}
          >
            <figure>
              <img src={station.logo || '/radio-no-logo.png'} alt="" className={styles['card-img']} />
            </figure>
            <p className={styles['card-title']}>{station.name}</p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={styles['icon-favorite']}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </Card>
        ))}
      </CardsList>

      <Pagination
        pages={Math.ceil(totalCount / limit)}
        current={Math.floor(offset / limit + 1)}
        className={styles.pagination}
        onPageChange={pageChangeHandler}
      ></Pagination>
    </>
  );
}
