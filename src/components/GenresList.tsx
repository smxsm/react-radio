import { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { DocumentTitleContext } from '../context/DocumentTitleContext';

import Card from './ui/Card';
import CardsList from './ui/CardsList';

const genres = [
  { name: 'Pop & Top 40', tag: 'pop' },
  { name: 'Rock', tag: 'rock' },
  { name: 'Prog', tag: 'prog' },  
  { name: 'Metal', tag: 'metal' },
  { name: 'Gothic', tag: 'gothic' },
  { name: 'Wave', tag: 'wave' },
  { name: 'Jazz', tag: 'jazz' },
  { name: 'Blues', tag: 'blues' },
  { name: 'Country', tag: 'country' },
  { name: 'Folk', tag: 'folk' },
  { name: 'World', tag: 'world' },
  { name: 'Electronic', tag: 'electronic' },
  { name: 'Hip hop', tag: 'hip-hop' },
  { name: 'R&B', tag: 'rnb' },
  { name: 'Indie', tag: 'indie' },
  { name: 'Alternative', tag: 'alternative' },
  { name: 'Punk', tag: 'punk' },
  { name: 'Reggae', tag: 'reggae' },
  { name: 'Latin', tag: 'latin' },
  { name: 'Classical', tag: 'classical' },
  { name: 'Opera', tag: 'opera' },
  { name: 'Rap', tag: 'rap' },
  { name: 'Dance', tag: 'dance' },
  { name: 'House', tag: 'house' },
  { name: '70s', tag: '70s' },
  { name: '80s', tag: '80s' },
  { name: '90s', tag: '90s' },
  { name: '00s', tag: '00s' },
];

export default function GenresList() {
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;

  useEffect(() => {
    setDocumentTitle('Browse stations');
  }, [setDocumentTitle]);

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
