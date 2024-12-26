import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import { randomUUID } from 'crypto';
import * as auth from './services/auth';
import { statements } from './services/database';
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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
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

  // Auth endpoints
  app.post('/auth/signup', async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const existingUser = auth.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      const user = await auth.createUser(email, firstName, lastName, password);
      const session = await auth.createSession(user.id);

      res.json({ user, session });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/auth/signin', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const result = await auth.signIn(email, password);
      if (!result) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      res.json(result);
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/auth/signout', (req: Request, res: Response) => {
    try {
      const sessionId = req.headers.authorization?.split(' ')[1];
      if (!sessionId) {
        return res.status(401).json({ error: 'No session provided' });
      }

      auth.deleteSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Signout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Session middleware for protected routes
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.headers.authorization?.split(' ')[1];
      if (!sessionId) {
        return res.status(401).json({ error: 'No session provided' });
      }

      const session = auth.getSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }

      const user = auth.getUserById(session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Add user to request for use in protected routes
      (req as any).user = user;
      (req as any).session = session;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Protected routes
  app.get('/user/profile', requireAuth, (req: Request, res: Response) => {
    res.json({ user: (req as any).user });
  });

  // Custom stations endpoints
  app.get('/stations', requireAuth, (req: Request, res: Response) => {
    try {
      const orderBy = (req.query.orderBy as string) || 'created_at';
      const order = (req.query.order as string)?.toUpperCase() || 'DESC';
      //const distance = parseInt(req.query.distance as string) || -1;
      
      let statement;
      if (orderBy === 'name') {
        statement = order === 'ASC' ? statements.getAllStations.byNameAsc : statements.getAllStations.byName;
      } else {
        // Default to created_at
        statement = order === 'ASC' ? statements.getAllStations.byCreatedAtAsc : statements.getAllStations.byCreatedAt;
      }
      
      const stations = statement.all();
      res.json(stations);
    } catch (error) {
      console.error('Get stations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/stations/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const station = statements.getStationById.get(req.params.id);
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }
      res.json(station);
    } catch (error) {
      console.error('Get station error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/stations', requireAuth, (req: Request, res: Response) => {
    try {
      const { id, name, logo, listen_url } = req.body;
      statements.upsertStation.run({ id, name, logo, listen_url });
      const station = statements.getStationById.get(id);
      res.json(station);
    } catch (error) {
      console.error('Create station error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/stations/:id', requireAuth, (req: Request, res: Response) => {
    try {
      statements.deleteStation.run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete station error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Track history endpoints
  app.get('/tracks/history', requireAuth, (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const tracks = statements.getTrackHistory.all((req as any).user.id, limit);
      res.json(tracks);
    } catch (error) {
      console.error('Get track history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/tracks/history', requireAuth, (req: Request, res: Response) => {
    try {
      const { track_id } = req.body;
      statements.addTrackHistory.run({
        track_id,
        user_id: (req as any).user.id
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Add track history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/tracks/history/:trackId', requireAuth, (req: Request, res: Response) => {
    try {
      statements.deleteTrackHistory.run(req.params.trackId, (req as any).user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete track history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/tracks/history', requireAuth, (req: Request, res: Response) => {
    try {
      statements.clearTrackHistory.run((req as any).user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Clear track history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Listen history endpoints
  app.get('/listen/history', requireAuth, (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = statements.getListenHistory.all((req as any).user.id, limit);
      res.json(history);
    } catch (error) {
      console.error('Get listen history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/listen/history', requireAuth, (req: Request, res: Response) => {
    try {
      const { station_id, name, logo, listen_url } = req.body;
      statements.addListenHistory.run({
        station_id,
        user_id: (req as any).user.id,
        name,
        logo,
        listen_url
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Add listen history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/listen/history/:stationId', requireAuth, (req: Request, res: Response) => {
    try {
      statements.deleteListenHistory.run(req.params.stationId, (req as any).user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete listen history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/listen/history', requireAuth, (req: Request, res: Response) => {
    try {
      statements.clearListenHistory.run((req as any).user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Clear listen history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


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

        const trackId = randomUUID();
        statements.upsertTrackMatch.run({
          id: trackId,
          artist: matchedTrack.artist,
          title: matchedTrack.title,
          album: matchedTrack.album,
          artwork: matchedTrack.artwork,
          release_date: matchedTrack.releaseDate ? new Date(matchedTrack.releaseDate).toISOString() : null,
          apple_music_url: matchedTrack.appleMusicUrl || '',
          youtube_url: matchedTrack.youTubeUrl || ''
        });

        data.matchedTrack = {
          id: trackId,
          artist: matchedTrack.artist,
          title: matchedTrack.title,
          album: matchedTrack.album,
          releaseDate: matchedTrack.releaseDate,
          artwork: matchedTrack.artwork,
          appleMusicUrl: matchedTrack.appleMusicUrl || '',
          youTubeUrl: matchedTrack.youTubeUrl || ''
        };
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
