import { useState, useEffect } from 'react';

export function useCountries() {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    fetch('https://at1.api.radio-browser.info/json/countries?order=name')
      .then((res) => res.json())
      .then((countries) => setCountries(countries.sort((a: any, b: any) => a.name.localeCompare(b.name))));
  }, []);

  return countries;
}
