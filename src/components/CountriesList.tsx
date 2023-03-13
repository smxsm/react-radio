import { Link } from 'react-router-dom';
import { Country, useCountries } from '../hooks';
import Card from './ui/Card';
import CardsList from './ui/CardsList';

export default function CountriesList() {
  const countries: Country[] = useCountries();

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
