import { useState, useEffect } from 'react';
import useRadioApiRandomServer from './useRadioApiRadomServer';

export type Country = {
  name: string;
  code: string;
  stationCount: number;
};

export function useCountries() {
  const apiUrl = useRadioApiRandomServer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch('https://at1.api.radio-browser.info/json/countries?order=name')
      .then((res) => res.json())
      .then((data) => {
        const countries = data
          .map((entry: any) => ({
            name: entry.name,
            code: entry['iso_3166_1'],
            stationCount: entry.stationcount,
          }))
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

        setCountries(countries);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [apiUrl]);

  return { loading, countries, error };
}
