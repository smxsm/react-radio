import { useEffect, useState } from 'react';

type RadioBrowserApiServers = {
  ip: string;
  name: string;
};

type EndpointStats = {
  name?: string;
  stationcount?: number;
  stations?: number;
};

type StationsFilter = {
  category?: string;
  value?: string;
};

type ListOptions = {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: string;
};

type RadioStation = {
  id: string;
  name: string;
  logo: string;
  listenUrl: string;
};

const routeToApiCategory: any = {
  countries: { stationsEndpoint: 'bycountrycodeexact', statsEndpoint: 'countries' },
  genres: { stationsEndpoint: 'bytag', statsEndpoint: 'tags' },
};

const routeToApiSort: { [key: string]: string } = {
  name: 'name',
  popularity: 'clickcount',
  trending: 'clicktrend',
};

export function useStations(
  { category = '', value }: StationsFilter,
  { limit = 60, offset = 0, sort = '', order = 'asc' }: ListOptions
): { data: { totalCount: number; stations: RadioStation[] }; error: Error | null; loading: boolean } {
  const [apiUrl, setApiUrl] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Select a random server
  useEffect(() => {
    fetch(`https://de1.api.radio-browser.info/json/servers`)
      .then<RadioBrowserApiServers[]>((res) => res.json())
      .then((servers) => {
        const randomHost = servers[Math.floor(Math.random() * servers.length)].name;
        setApiUrl(`https://${randomHost}/json`);
      });
  }, []);

  // Fetch stations
  useEffect(() => {
    if (!apiUrl) {
      return;
    }
    setLoading(true);

    // We are getting server statistic for the total stations count
    let statsUrl = `${apiUrl}/stats`;
    let stationsUrl = `${apiUrl}/stations`;

    if (category && value) {
      const { statsEndpoint, stationsEndpoint } = routeToApiCategory[category];
      stationsUrl += `/${stationsEndpoint}/${value}`;
      // Instead of server stats get stats about the particular endpoint to get total stations count from
      statsUrl = `${apiUrl}/${statsEndpoint}/${value}`;
    }

    stationsUrl += `?order=${routeToApiSort[sort] || 'name'}${order === 'desc' ? '&reverse=true' : ''}&limit=${
      limit > 0 && limit < 301 ? limit : 60
    }&offset=${offset}`;

    fetch(statsUrl)
      .then((res) => res.json())
      // If we are using global server stats we are getting an object instead of array
      .then<EndpointStats[]>((data) => (Array.isArray(data) ? data : [data]))
      .then((stats) => stats.reduce((sum, { stationcount, stations }) => sum + (stationcount || stations || 0), 0))
      .then(setTotalCount)
      .then(() => fetch(stationsUrl))
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
      )
      .catch(setError)
      .finally(() => setLoading(false));
  }, [apiUrl, category, value, limit, sort, order, offset]);

  return { data: { totalCount, stations }, error, loading };
}
