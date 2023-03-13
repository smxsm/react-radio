import { useState, useEffect } from 'react';

export type Country = {
  name: string;
  code: string;
  stationCount: number;
};

export function useCountries() {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
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
      });
  }, []);

  return countries;
}
