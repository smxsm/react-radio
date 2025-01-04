import Fuse from 'fuse.js';
import { TrackInfo, SpotifyItem } from '../types/mediaTypes';
import logger from './logger';

const client_id = process.env.SPOTIFY_CLIENT_ID ?? '';
const client_secret = process.env.SPOTIFY_CLIENT_SECRET ?? '';
// score = 0 is perfect match, score = 1 is no match!
const score_threshold = parseFloat(process.env.SPOTIFY_FUSE_SCORE_THRESHOLD ?? '0.6');

const options = {
  useExtendedSearch: true,
  includeScore: true
};

async function getAccessToken () {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret)
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return data.access_token ?? '';

}
export default async function spotifySearch(searchTerm: string): Promise<TrackInfo | null> {
  try {
    if (!searchTerm || !client_id) {
      return null;
    }

    const token = await getAccessToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }

    // url encode searchTerm
    const encodedSearchTerm = encodeURIComponent(searchTerm);

    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodedSearchTerm}&type=track`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    const data = (await response.json())?.tracks?.items;
    //logger.writeDebug('Spotify result', data);

    if (!data?.length) {
      return null;
    }

    // Using Fuse.js to select best match
    let fuse = new Fuse(
      data.map(
        ({ name, artists, album }: SpotifyItem) =>
          `${artists.map(artist => artist.name).join(' ')} ${name !== undefined ? ` ${name}` : ''} ${album.name}`
      ), options
    );
    
    // First run trying to filter out collection albums
    let searchResults = fuse.search(
      `${searchTerm} !greatest !ultimate !collection !best !hits !essential !single !live !various !mix !advertisement !adwtag`
    );
    // filter items with score >= score_threshold    
    searchResults = searchResults.filter((result) => {
      logger.writeDebug('Spotify run 1 fuse.js result', result);
      return typeof result.score === 'number' && result.score <= score_threshold;
    });
    
    if (!searchResults.length) {
      // If first run found nothing, try again without considering album type
      fuse = new Fuse(data.map(({ name, artists }: SpotifyItem) => `${artists.map(artist => artist.name).join(' ')} ${name}`), options);
      searchResults = fuse.search(searchTerm);
      searchResults = searchResults.filter((result) => {
        logger.writeDebug('Spotify run 2 fuse.js result', result);
        return typeof result.score === 'number' && result.score <= score_threshold;
      });
    }
    
    if (!searchResults.length) {
      return null;
    }

    const [{ refIndex }] = searchResults;
    const item = data[refIndex];
    return {
      artist: item.artists.map((artist: { name: any; }) => artist.name).join(', ') || '',
      title: item.name || '',
      album: item.album.name || '',
      releaseDate: new Date(item.album.release_date) || null,
      artwork: item.album.images[0]?.url || '',
      spotifyUrl: item.external_urls.spotify || '',
    };
  } catch (err) {
    return null;
  }
}
