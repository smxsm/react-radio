import { Link } from 'react-router-dom';
import { useCountries } from '../hooks';
import Card from './ui/Card';
import CardsList from './ui/CardsList';

export default function CountriesList() {
  const countries: any[] = useCountries();

  return (
    <CardsList>
      {countries.map((country) => (
        <Link to={`${country['iso_3166_1']}`} key={country['iso_3166_1']}>
          <Card>
            <img src={`http://flagsapi.com/${country['iso_3166_1']}/flat/64.png`} alt="" />
            <p>
              {country.name} ({country.stationcount})
            </p>
          </Card>
        </Link>
      ))}
    </CardsList>
  );
}
