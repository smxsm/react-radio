import { Link } from 'react-router-dom';
import { useCountries } from '../hooks/useCountries';
import Card from './ui/Card';
import CardsList from './ui/CardsList';

export default function CountriesList() {
  const { loading, countries, error } = useCountries();

  if (loading) {
    return <p>Loading...</p>;
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
