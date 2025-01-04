import Fuse from 'fuse.js';
import { TrackInfo, iTunesItem } from '../types/mediaTypes';
import logger from './logger';

const options = {
  useExtendedSearch: true,
  includeScore: true
};
// score = 0 is perfect match, score = 1 is no match!
const score_threshold = parseFloat(process.env.ITUNES_FUSE_SCORE_THRESHOLD ?? '0.6');
export default async function iTunesSearch(searchTerm: string): Promise<TrackInfo | null> {
  try {
    if (!searchTerm) {
      return null;
    }
    const res = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=song`);
    const data = (await res.json())?.results;
    if (!data?.length) {
      return null;
    }
    
    // Using Fuse.js to select best match
    let fuse = new Fuse(
      data.map(
        ({ artistName, trackName, collectionName, collectionArtistName }: iTunesItem) =>
          `${artistName} ${trackName}${collectionArtistName !== undefined ? ` ${collectionArtistName}` : ''} ${collectionName}`
      ), options
    );
    
    // First run trying to filter out collection albums
    let searchResults = fuse.search(
      `${searchTerm} !greatest !ultimate !collection !best !hits !essential !single !live !various !mix !advertisement !adwtag`
    );
    // filter items with score >= score_threshold
    searchResults = searchResults.filter((result) => {
      logger.writeDebug('iTunes run 1 fuse.js result', result);
      return typeof result.score === 'number' && result.score <= score_threshold;
    });
    
    if (!searchResults.length) {
      // If first run found nothing, try again without considering album type
      fuse = new Fuse(data.map(({ artistName, trackName }: iTunesItem) => `${artistName} ${trackName}`), options);
      searchResults = fuse.search(searchTerm);
      // filter items with score >= score_threshold
      searchResults = searchResults.filter((result) => {
        logger.writeDebug('iTunes run 2 fuse.js result', result);
        return typeof result.score === 'number' && result.score <= score_threshold;
      });
    }
    
    if (!searchResults.length) {
      return null;
    }
    
    const [{ refIndex }] = searchResults;
    return {
      artist: data[refIndex].artistName || '',
      title: data[refIndex].trackName || '',
      album: data[refIndex].collectionName || '',
      releaseDate: new Date(data[refIndex].releaseDate) || null,
      artwork: data[refIndex].artworkUrl100,
      appleMusicUrl: data[refIndex].trackViewUrl,
      spotifyUrl: '',
    };
  } catch (err) {
    return null;
  }
}
