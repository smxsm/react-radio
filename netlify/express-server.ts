import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import getIcecastMetadata from './services/streamMetadata.js';
import iTunesSearch from './services/iTunes.js';
import youTubeSearch from './services/youTube.js';

// Custom CORS middleware
function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  
  if (!origin || /https?:\/\/localhost:?\d{0,5}/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}


async function startServer() {
  const app = express();
  const port = process.env.PORT || 3001;

  // Middleware
  app.use(express.json());
  app.use(corsMiddleware);

  // Initialize Supabase
  const supabase = createClient(
    'https://iddsgsocgqklrqeuykzn.supabase.co',
    process.env.SUPABASE_KEY || ''
  );

  // Cache setup
  const cache = new Map();

// Helper function from edge function
function cleanTitleForSearch(title: string) {
  const filterTerms = ['ft', 'feat', 'vs'];
  return title
    .match(/[a-zA-Z]+(?![^(]*\))/g)
    ?.filter((term) => !filterTerms.includes(term.toLowerCase()))
    .join(' ');
}

// Main endpoint
app.get('/station-metadata', async (req: Request, res: Response) => {
  const url = req.query.url as string | undefined;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const streamResponse = await fetch(url, {
      method: 'GET',
      headers: { 'Icy-MetaData': '1' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const icyMetaInt = parseInt(streamResponse.headers.get('Icy-MetaInt') || '');
    const stationMetadata = await getIcecastMetadata(streamResponse, icyMetaInt);
    const data = { ...cache.get(stationMetadata.title), stationMetadata };

    if (!data.stationMetadata.title) {
      throw new Error('No metadata collected');
    }

    const searchTerm = cleanTitleForSearch(data.stationMetadata.title);
    if (!searchTerm) {
      throw new Error('Search string is empty');
    }

    if (!data.matchedTrack) {
      const matchedTrack = await iTunesSearch(searchTerm);

      if (matchedTrack) {
        matchedTrack.youTubeUrl = await youTubeSearch(searchTerm) || '';

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
              apple_music_url: matchedTrack.appleMusicUrl || '',
              youtube_url: matchedTrack.youTubeUrl || '',
            },
            { onConflict: 'text' }
          )
          .select();

        if (supabaseResult && supabaseResult[0]) {
          data.matchedTrack = {
            id: supabaseResult[0].id,
            artist: supabaseResult[0].artist,
            title: supabaseResult[0].title,
            album: supabaseResult[0].album,
            releaseDate: supabaseResult[0].release_date,
            artwork: supabaseResult[0].artwork,
            appleMusicUrl: supabaseResult[0].apple_music_url,
            youTubeUrl: supabaseResult[0].youtube_url,
          };
        }
      }
    }

    cache.set(data.stationMetadata.title, { ...cache.get(data.stationMetadata.title), ...data });
    if (cache.size > 100) {
      cache.delete(Array.from(cache.keys())[0]);
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.json({});
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

  // Start server
  app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
  });
}

// Run the server
startServer().catch(console.error);
