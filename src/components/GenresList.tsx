import { Link } from 'react-router-dom';
import Card from './ui/Card';
import CardsList from './ui/CardsList';

const genres = [
  { name: 'Pop & Top 40', tag: 'pop' },
  { name: 'Rock', tag: 'rock' },
  { name: 'Jazz', tag: 'jazz' },
  { name: 'Blues', tag: 'blues' },
  { name: 'Country', tag: 'country' },
  { name: 'Folk', tag: 'folk' },
  { name: 'World', tag: 'world' },
  { name: 'Dance', tag: 'dance' },
  { name: 'House', tag: 'house' },
];

export default function GenresList() {
  return (
    <CardsList>
      {genres.map((genre) => (
        <Link to={genre.tag} key={genre.tag}>
          <Card>{genre.name}</Card>
        </Link>
      ))}
    </CardsList>
  );
}
