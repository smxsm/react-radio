import getIcecastMetadata from '../services/streamMetadata.ts';
import iTunesSearch from '../services/iTunes.ts';
import youTubeSearch from '../services/youTube.ts';

let cache = new Map();

function cleanTitleForSearch(title: string) {
  const filterTerms = ['ft', 'feat', 'vs'];
  return title
    .match(/\w+(?![^(]*\))/g)
    ?.filter((term) => !filterTerms.includes(term.toLowerCase()))
    .join(' ');
}

const edge = async (req: Request) => {
  const url = new URL(req.url).searchParams.get('url') || '';
  const responseHeaders = new Headers({ 'Content-Type': 'application/json' });
  const origin = req.headers.get('Origin') || '';
  if (new URL(req.url).origin === origin || /https?:\/\/localhost:?\d{0,5}/.test(origin)) {
    responseHeaders.append('Access-Control-Allow-Origin', origin);
  }

  try {
    const signal = AbortSignal.timeout(5000);
    const res = await fetch(url, { method: 'GET', headers: { 'Icy-MetaData': '1' }, signal });
    const icyMetaInt = parseInt(res.headers.get('Icy-MetaInt') || '');

    const streamMetadata = await getIcecastMetadata(res, icyMetaInt);
    const data = { ...cache.get(streamMetadata.title), ...streamMetadata };

    if (!data.title) {
      throw new Error('No metadata collected');
    }

    if (!data.trackMatch) {
      const searchTerm = cleanTitleForSearch(data.title);
      const trackMatch = await iTunesSearch(searchTerm);
      if (trackMatch) {
        data.trackMatch = {};
        data.trackMatch.artist = trackMatch.artist;
        data.trackMatch.title = trackMatch.title;
        data.trackMatch.album = trackMatch.album;
        data.trackMatch.releaseDate = trackMatch.releaseDate;
        data.trackMatch.artwork = trackMatch.artwork;
        data.trackMatch.appleMusicUrl = trackMatch.appleMusicUrl;
        const youTubeUrl = await youTubeSearch(searchTerm);
        if (youTubeUrl) {
          data.trackMatch.youTubeUrl = youTubeUrl;
        }
      }
    }

    cache.set(data.title, { ...cache.get(data.title), ...data });
    if (cache.size > 100) {
      cache.delete(cache.keys()[0]);
    }

    return new Response(JSON.stringify(data), { headers: responseHeaders });
  } catch (err) {
    console.log(err);
    return new Response(JSON.stringify({}), { headers: responseHeaders });
  }
};

export default edge;
export const config = { path: '/station-metadata' };
