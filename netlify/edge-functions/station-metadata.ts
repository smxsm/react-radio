import getIcecastMetadata from '../services/streamMetadata.ts';
import iTunesSearch from '../services/iTunes.ts';

let cache = new Map();

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

    if (!data.match) {
      console.log('No track info. Searching iTunes...');
      const match = await iTunesSearch(data.title);
      if (match) {
        data.match.artist = match.artist;
        data.match.title = match.title;
        data.match.album = match.album;
        data.match.releaseDate = match.releaseDate;
        data.match.artwork = match.artwork;
        data.streamLinks.appleMusic = match.appleMusicUrl;
      }
    }

    cache.set(data.title, { ...cache.get(data.title), ...data });
    if (cache.size > 100) {
      cache.delete(cache.keys()[0]);
    }

    console.log(`Cache now has ${cache.size} items`);

    return new Response(JSON.stringify(data), { headers: responseHeaders });
  } catch (err) {
    return new Response(JSON.stringify({}), { headers: responseHeaders });
  }
};

export default edge;
export const config = { path: '/station-metadata' };
