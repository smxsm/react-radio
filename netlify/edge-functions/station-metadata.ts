import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

import getIcecastMetadata from '../services/streamMetadata.ts';
import iTunesSearch from '../services/iTunes.ts';
import youTubeSearch from '../services/youTube.ts';

const supabase = createClient('https://iddsgsocgqklrqeuykzn.supabase.co', Deno.env.get('SUPABASE_KEY'));
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

    const stationMetadata = await getIcecastMetadata(res, icyMetaInt);
    const data = { ...cache.get(stationMetadata.title), stationMetadata };

    if (!data.stationMetadata.title) {
      throw new Error('No metadata collected');
    }

    if (!data.matchedTrack) {
      const searchTerm = cleanTitleForSearch(data.stationMetadata.title);
      const matchedTrack = await iTunesSearch(searchTerm);
      if (matchedTrack) {
        const { data: supabaseResult } = await supabase
          .from('track_match')
          .upsert(
            {
              text: searchTerm,
              artist: matchedTrack.artist,
              title: matchedTrack.title,
              album: matchedTrack.album,
              artwork: matchedTrack.artwork,
              release_date: matchedTrack.releaseDate,
            },
            { onConflict: 'text' }
          )
          .select();

        data.matchedTrack = {};
        data.matchedTrack.id = supabaseResult[0].id;
        data.matchedTrack.artist = supabaseResult[0].artist;
        data.matchedTrack.title = supabaseResult[0].title;
        data.matchedTrack.album = supabaseResult[0].album;
        data.matchedTrack.releaseDate = supabaseResult[0].release_date;
        data.matchedTrack.artwork = supabaseResult[0].artwork;

        data.matchedTrack.appleMusicUrl = matchedTrack.appleMusicUrl;
        const youTubeUrl = await youTubeSearch(searchTerm);
        if (youTubeUrl) {
          data.matchedTrack.youTubeUrl = youTubeUrl;
        }
      }
    }

    cache.set(data.stationMetadata.title, { ...cache.get(data.stationMetadata.title), ...data });
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
