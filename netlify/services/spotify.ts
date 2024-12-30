import Fuse from 'fuse.js';
import { TrackInfo } from '../types/mediaTypes';

const client_id = process.env.SPOTIFY_CLIENT_ID ?? '';
const client_secret = process.env.SPOTIFY_CLIENT_SECRET ?? '';
// score = 0 is perfect match, score = 1 is no match!
const score_threshold = parseFloat(process.env.SPOTIFY_FUSE_SCORE_THRESHOLD ?? '0.6');

interface SpotifyItem {
  album: {
    album_type: string;
    total_tracks: number;
    available_markets: string[];
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    name: string;
    release_date: string;
    release_date_precision: string;
    type: string;
    uri: string;
    artists: Array<{
      external_urls: {
        spotify: string;
      };
      href: string;
      id: string;
      name: string;
      type: string;
      uri: string;
    }>;
    is_playable: boolean;
  };
  artists: Array<{
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }>;
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: {
    isrc: string;
  };
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  is_playable: boolean;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: string;
  uri: string;
  is_local: boolean;
}

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
      return typeof result.score === 'number' && result.score <= score_threshold;
    });
    
    if (!searchResults.length) {
      // If first run found nothing, try again without considering album type
      fuse = new Fuse(data.map(({ name, artists }: SpotifyItem) => `${artists.map(artist => artist.name).join(' ')} ${name}`), options);
      searchResults = fuse.search(searchTerm);
      console.log('Spotify fuse.js results 2 before filter', searchResults);
      searchResults = searchResults.filter((result) => {
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
