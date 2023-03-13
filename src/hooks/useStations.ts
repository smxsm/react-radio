import { useEffect, useState } from 'react';

type StationsFilter = {
  category?: string;
  value?: string;
};

type ListOptions = {
  limit?: number;
  sort?: string;
  order?: string;
};

const routeToApiCategory: { [key: string]: string } = {
  countries: 'bycountrycodeexact',
  genres: 'bytag',
};

const routeToApiSort: { [key: string]: string } = {
  name: 'name',
  popularity: 'clickcount',
  trending: 'clicktrend',
};

export function useStations(
  { category = '', value }: StationsFilter,
  { limit = 60, sort = '', order = 'asc' }: ListOptions
) {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    let apiUrl = 'https://at1.api.radio-browser.info/json/stations';

    if (routeToApiCategory[category] && value) {
      apiUrl += `/${routeToApiCategory[category]}/${value}`;
    }

    apiUrl += `?order=${routeToApiSort[sort] || 'name'}${order === 'desc' ? '&reverse=true' : ''}&limit=${
      limit > 0 && limit < 301 ? limit : 60
    }`;

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) =>
        setStations(
          data.map(({ stationuuid, name, favicon, url_resolved }: any) => ({
            id: stationuuid,
            name,
            logo: favicon,
            listenUrl: url_resolved,
          }))
        )
      );
  }, [category, value, limit, sort, order]);

  return stations;
}
