import { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { DocumentTitleContext } from '../context/DocumentTitleContext';
import { useCountries } from '../hooks/useCountries';

import Card from './ui/Card';
import CardsList from './ui/CardsList';
import Spinner from './ui/Spinner';

import styles from './CountriesList.module.css';

export default function CountriesList() {
  const { loading, countries, error } = useCountries();
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;

  useEffect(() => {
    setDocumentTitle('Browse stations');
  }, [setDocumentTitle]);

  if (loading) {
    return <Spinner className={styles.spinner} />;
  }

  if (error) {
    return <p>{error.message}</p>;
  }

  return (
    <CardsList>
      {countries.map((country) => (
        <Link to={`${country.code}`} key={country.code}>
          <Card>
            <img src={`http://flagsapi.com/${country.code}/flat/64.png`} alt="" />
            <p>
              {country.name} ({country.stationCount})
            </p>
          </Card>
        </Link>
      ))}
    </CardsList>
  );
}
