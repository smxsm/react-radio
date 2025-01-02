import express from 'express';
import 'dotenv/config';
import type { Request, Response, NextFunction } from 'express';
import { CacheEntry, MetadataResponse, Track } from './types/mediaTypes';
import { randomUUID } from 'crypto';
import * as auth from './services/auth';
import { statements } from './services/database';
import getIcecastMetadata from './services/streamMetadata';
import iTunesSearch from './services/iTunes';
import spotifySearch from './services/spotify';
import youTubeSearch from './services/youTube';
import PQueue from 'p-queue';
import nodemailer from 'nodemailer';
import net from 'net';

// Custom CORS middleware
function corsMiddleware (req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin ?? '';

  // Allow localhost with any port
  if (!origin || /https?:\/\/localhost:?\d{0,5}/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Add all required CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-Authentication-Token'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL ?? '';
  const backendUrl = process.env.BACKEND_URL ?? '';
  // restrict access to localhost and frontendUrl only
  if (origin !== 'localhost' && origin !== '127.0.0.1' && frontendUrl.indexOf(origin) === -1 && backendUrl.indexOf(origin) === -1) {
    console.log('ACCESS FORBIDDEN', origin);
    return res.status(403).json({ error: 'Forbidden' });
  }
  // check for auth header
  if (!auth.isAuthenticated(req)) {
    console.log('NO AUTH', req.hostname);
    return res.status(401).json({ error: 'Access denied' });
  }

  next();
}

async function startServer () {
  const app = express();
  const port = process.env.PORT || 3001;

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    console.log(`[${requestId}] ${req.method} ${req.url} started`);

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${requestId}] ${req.method} ${req.url} completed in ${duration}ms with status ${res.statusCode}`);
    });

    next();
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Middleware
  app.use(express.json());
  app.use(corsMiddleware);

  async function deliverMail (recipient: string, subject: string, text: string, html: string) {
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_ADMIN,
      to: recipient,
      subject: subject,
      text: text,
      html: html
    });

    console.log("Message sent: %s", info.messageId);

    return true;
  }

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

  app.post('/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = auth.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const resetToken = randomUUID();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiration

      statements.createPasswordReset.run({
        token: resetToken,
        user_id: user.id,
        expires_at: expiresAt.toISOString()
      });

      // send an email here
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/change-password/${resetToken}`;
      await deliverMail(email, 'ReactRadio password reset', 'Go here to reset your password: ' + resetLink, '<p>Click this link to reset your password:<br/><a href="' + resetLink + '">' + resetLink + '</a><p>');
      res.json({ response: 'OK' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      // Validate password
      if (newPassword.length < 14) {
        return res.status(400).json({ error: 'Password must be at least 14 characters long' });
      }
      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
      }
      if (!/[!@#$%^&*(),.?":{}|<>_]/.test(newPassword)) {
        return res.status(400).json({ error: 'Password must contain at least one special character' });
      }

      const reset = statements.getPasswordReset.get(token) as { user_id: string, expires_at: string } | undefined;
      if (!reset) {
        return res.status(404).json({ error: 'Invalid or expired reset token' });
      }

      if (new Date(reset.expires_at) < new Date()) {
        statements.deletePasswordReset.run(token);
        return res.status(400).json({ error: 'Reset token has expired' });
      }

      const passwordHash = await auth.hashPassword(newPassword);
      statements.updateUserPassword.run({
        user_id: reset.user_id,
        password_hash: passwordHash
      });

      statements.deletePasswordReset.run(token);
      res.json({ success: true });
    } catch (error) {
      console.error('Reset password error:', error);
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

  interface Station {
    listen_url: string;
  }
  // Custom stations endpoints
  app.get('/stations', requireAuth, async (req: Request, res: Response) => {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000);
    });

    try {
      const userId = (req as any).user.id;
      const orderBy = (req.query.orderBy as string) || 'created_at';
      const order = (req.query.order as string)?.toUpperCase() || 'DESC';

      let statement;
      if (orderBy === 'name') {
        statement = order === 'ASC' ? statements.getAllStations.byNameAsc : statements.getAllStations.byName;
      } else {
        statement = order === 'ASC' ? statements.getAllStations.byCreatedAtAsc : statements.getAllStations.byCreatedAt;
      }

      const result = await Promise.race([
        Promise.resolve(statement.all(userId)),
        timeoutPromise
      ]);

      if (Array.isArray(result)) {
        const stations: Station[] = result;
        /*
        stations.forEach((station: Station) => {
          station.listen_url = `http://localhost:3001/proxy?url=${encodeURIComponent(station.listen_url)}`;
          console.error('station url', station.listen_url);
        });
        */
        res.json(stations);
      } else {
        // Handle the case where the timeout occurred
        console.error('Database query timed out');
        // You might want to throw an error or handle this case differently
        res.json(result);
      }

    } catch (error: any) {
      console.error('Get stations error:', error);

      if (error.message === 'Request timeout') {
        res.status(504).json({ error: 'Request timeout' });
      } else {
        res.status(500).json({
          error: 'Database error',
          details: error?.message || 'Unknown database error'
        });
      }
    }
  });

  app.get('/stations/:id', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      const userId = (req as any).user.id;
      console.log('Station search', userId, req.params.id);
      const station = statements.getStationById.get(req.params.id, userId);
      clearTimeout(timeout);

      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }
      //station.listen_url = `http://localhost:3001/proxy?url=${encodeURIComponent(station.listen_url)}`;

      res.json(station);
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Get station error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  app.post('/stations', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      const { id, name, logo, listen_url } = req.body;
      const userId = (req as any).user.id;
      console.log('Station upsert', userId, id);
      statements.upsertStation.run({ station_id: id, user_id: userId, name, logo, listen_url });
      const station = statements.getStationById.get(id, userId);
      console.log('station', station);
      clearTimeout(timeout);
      res.json(station);
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Create station error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  app.delete('/stations/:id', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      const userId = (req as any).user.id;
      statements.deleteStation.run(req.params.id, userId);
      clearTimeout(timeout);
      res.json({ success: true });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Delete station error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  // Custom stations endpoints
  app.get('/usertracks', requireAuth, async (req: Request, res: Response) => {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000);
    });

    try {
      const userId = (req as any).user.id;
      const orderBy = (req.query.orderBy as string) || 'created_at';
      const order = (req.query.order as string)?.toUpperCase() || 'DESC';

      let statement;
      if (orderBy === 'name') {
        statement = order === 'ASC' ? statements.getAllUserTracks.byTitleAsc : statements.getAllUserTracks.byTitle;
      } else {
        statement = order === 'ASC' ? statements.getAllUserTracks.byCreatedAtAsc : statements.getAllUserTracks.byCreatedAt;
      }

      // Race between the database operation and timeout
      const stations = await Promise.race([
        Promise.resolve(statement.all(userId)),
        timeoutPromise
      ]);

      res.json(stations);
    } catch (error: any) {
      console.error('Get stations error:', error);

      if (error.message === 'Request timeout') {
        res.status(504).json({ error: 'Request timeout' });
      } else {
        res.status(500).json({
          error: 'Database error',
          details: error?.message || 'Unknown database error'
        });
      }
    }
  });

  app.get('/usertracks/:id', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      const userId = (req as any).user.id;
      const track = statements.getUserTrackById.get(req.params.id, userId);
      clearTimeout(timeout);

      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      res.json(track);
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Get user track error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  app.post('/usertracks', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      const { id } = req.body;
      const userId = (req as any).user.id;
      const track = statements.getUserTrackById.get(id, userId);
      // only add if not already on user list
      if (!track) {
        statements.addUserTrack.run({ track_id: id, user_id: userId });
      }
      clearTimeout(timeout);
      res.json({ success: true });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Create user track error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  app.delete('/usertracks/:id', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      const userId = (req as any).user.id;
      statements.deleteUserTrack.run(req.params.id, userId);
      clearTimeout(timeout);
      res.json({ success: true });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Delete user track error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });
  app.delete('/usertracks', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      const userId = (req as any).user.id;
      statements.clearUserTracks.run(userId);
      clearTimeout(timeout);
      res.json({ success: true });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Delete user track error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  // Track history endpoints
  app.get('/tracks/history', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const tracks = statements.getTrackHistory.all((req as any).user.id, limit);
      // edit some fields for each track
      (tracks as unknown as Track[]).forEach(track => {
        track.heardAt = track.created_at;
        track.spotifyUrl = track.spotify_url;
        track.youTubeUrl = track.youtube_url;
        track.appleMusicUrl = track.apple_music_url;
      });
      clearTimeout(timeout);
      res.json(tracks);
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Get track history error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  app.post('/tracks/history', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      const { track_id } = req.body;
      statements.addTrackHistory.run({
        track_id,
        user_id: (req as any).user.id
      });
      clearTimeout(timeout);
      res.json({ success: true });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Add track history error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  app.delete('/tracks/history/:trackId', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      statements.deleteTrackHistory.run(req.params.trackId, (req as any).user.id);
      clearTimeout(timeout);
      res.json({ success: true });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Delete track history error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  app.delete('/tracks/history', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      statements.clearTrackHistory.run((req as any).user.id);
      clearTimeout(timeout);
      res.json({ success: true });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Clear track history error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  // Listen history endpoints
  app.get('/listen/history', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = statements.getListenHistory.all((req as any).user.id, limit);
      // set the listenUrl of every history entry for the player context
      history.forEach((entry: any) => {
        entry.listenUrl = entry.listen_url;
        //entry.listenUrl = `http://localhost:3001/proxy?url=${encodeURIComponent(entry.listen_url)}`;
      });
      clearTimeout(timeout);
      res.json(history);
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Get listen history error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  app.post('/listen/history', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      const { station_id, name, logo, listen_url } = req.body;
      statements.addListenHistory.run({
        station_id,
        user_id: (req as any).user.id,
        name,
        logo,
        listen_url
      });
      clearTimeout(timeout);
      res.json({ success: true });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Add listen history error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  app.delete('/listen/history/:stationId', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      statements.deleteListenHistory.run(req.params.stationId, (req as any).user.id);
      clearTimeout(timeout);
      res.json({ success: true });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Delete listen history error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  app.delete('/listen/history', requireAuth, (req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timeout' });
    }, 5000);

    try {
      statements.clearListenHistory.run((req as any).user.id);
      clearTimeout(timeout);
      res.json({ success: true });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Clear listen history error:', error);
      res.status(500).json({
        error: 'Database error',
        details: error?.message || 'Unknown database error'
      });
    }
  });

  // Proxy endpoint
  app.get('/proxy', async (req, res) => {
    const streamUrl = req.query.url as string;

    if (!streamUrl) {
      return res.status(400).send('Missing stream URL');
    }

    try {
      const parsedUrl = new URL(streamUrl);
      const port = parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80);
      const host = parsedUrl.hostname;

      // Add CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*'); // Or specify your domain instead of '*'
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

      // Set content type for audio streaming
      res.setHeader('Content-Type', 'audio/mpeg'); // Adjust if you're using a different audio format
      res.setHeader('Accept-Ranges', 'bytes');

      // Additional headers that might help with streaming
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Create a TCP connection to the streaming server
      let portNumber: number;
      if (typeof port === 'string') {
        portNumber = parseInt(port, 10);
        if (isNaN(portNumber)) {
          throw new Error('Invalid port number');
        }
      } else if (typeof port === 'number') {
        portNumber = port;
      } else {
        throw new Error('Port must be a string or number');
      }

      const client = net.createConnection({ host, port: portNumber }, () => {

        // Send an HTTP GET request manually
        client.write(`GET ${parsedUrl.pathname} HTTP/1.1\r\n`);
        client.write(`Host: ${host}\r\n`);
        client.write('Connection: close\r\n');
        client.write('\r\n');
      });

      // Forward data from the streaming server to the client
      client.on('data', (data) => {
        res.write(data);
      });

      client.on('end', () => {
        res.end();
      });

      client.on('error', (err) => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error');
      });
    } catch (err) {
      console.error('Error parsing URL:', err);
      res.status(400).send('Invalid stream URL');
    }
  });

  // Cache setup
  const cache = new Map<string, CacheEntry>();
  const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour
  const metadataQueue = new PQueue({
    concurrency: 2, // Limit concurrent metadata processing
    timeout: 15000, // 15 second timeout for each task
    throwOnTimeout: true // Reject the promise when task times out
  });
  function getCache (key: string): any | undefined {
    const entry = cache.get(key);
    if (!entry) {
      return undefined;
    }
    if ((Date.now() - entry.timestamp) < CACHE_EXPIRATION_MS) {
      return entry;
    }
    console.log('Deleting lookup cache entry, expired!', entry);
    cache.delete(key);
    return undefined;
  }

  function cleanTitleForSearch (title: string) {
    const filterTerms = ['ft', 'feat', 'vs'];
    return title
      .match(/[a-zA-Z]+(?![^(]*\))/g)
      ?.filter((term) => !filterTerms.includes(term.toLowerCase()))
      .join(' ').trim();
  }

  // Main endpoint
  app.get('/station-metadata', async (req: Request, res: Response) => {
    const url = req.query.url as string | undefined;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    return metadataQueue.add(async () => {
      let controller: AbortController | null = new AbortController();

      try {
        console.log('Fetching metadata for URL:', url);
        const streamResponse = await fetch(url, {
          method: 'GET',
          headers: { 'Icy-MetaData': '1' },
          signal: controller.signal
        });

        if (!streamResponse.ok) {
          throw new Error(`Stream response error: ${streamResponse.status} ${streamResponse.statusText}`);
        }

        const icyMetaInt = parseInt(streamResponse.headers.get('Icy-MetaInt') || '0');
        if (!icyMetaInt) {
          console.warn('No ICY-MetaInt header found, using default value');
        }

        const stationMetadata = await getIcecastMetadata(streamResponse, icyMetaInt);
        const stationName = cleanTitleForSearch(stationMetadata.icyName);
        console.log('Metadata received:', stationMetadata);
        const cacheKey = `station:${stationMetadata.title}`;

        if (!stationMetadata.title) {
          throw new Error('No metadata collected');
        }

        const searchTerm = cleanTitleForSearch(stationMetadata.title);
        if (!searchTerm) {
          throw new Error('Search string is empty');
        }

        let data: MetadataResponse = { stationMetadata };

        // Try to find existing track match
        const existingMatch = getCache(cacheKey)?.data?.matchedTrack;

        console.log(`stationName: ${stationName} searchTerm: ${searchTerm}`);
        if (existingMatch) {
          data = { ...data, matchedTrack: existingMatch };
          console.log('Cache hit', data);
        } else if (stationName === searchTerm) {
          data.matchedTrack = undefined;
        } else {
          let matchedTrack = await iTunesSearch(searchTerm);
          const matchedTrack2 = await spotifySearch(searchTerm);
          console.log('iTunes searchResults', matchedTrack);
          console.log('Spotify searchResults', matchedTrack2);

          if (!matchedTrack) {
            matchedTrack = matchedTrack2 ?? null;
          } else {
            matchedTrack.spotifyUrl = matchedTrack2?.spotifyUrl || '';
          }

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
              youtube_url: matchedTrack.youTubeUrl || '',
              spotify_url: matchedTrack.spotifyUrl || ''
            });

            data.matchedTrack = {
              id: trackId,
              artist: matchedTrack.artist,
              title: matchedTrack.title,
              album: matchedTrack.album,
              releaseDate: matchedTrack.releaseDate ? new Date(matchedTrack.releaseDate).toISOString() : null,
              artwork: matchedTrack.artwork,
              appleMusicUrl: matchedTrack.appleMusicUrl || '',
              youTubeUrl: matchedTrack.youTubeUrl || '',
              spotifyUrl: matchedTrack.spotifyUrl || ''
            };

            // now store in cache
            if (cache) {
              const cacheEntry: CacheEntry = {
                url: matchedTrack.artwork,
                data: data,
                timestamp: Date.now()
              };
              cache.set(cacheKey, cacheEntry);
            }
          }
        }
        res.json(data);
      } catch (err) {
        console.error('Metadata error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metadata';
        console.error('Metadata error details:', errorMessage);
        res.status(500).json({ error: errorMessage });
      } finally {
        if (controller) {
          controller.abort();
          controller = null;
        }
      }
    });
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Health check timeout' });
    }, 5000);

    try {
      // Test database connection with a simple query
      const dbTest = statements.getUserById.get('test');
      const dbStatus = dbTest !== undefined ? 'ok' : 'error';

      clearTimeout(timeout);
      res.json({
        status: 'ok',
        database: dbStatus,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'error',
        database: 'error',
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Start server
  const server = app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
  });

  // Handle server errors
  server.on('error', (error: any) => {
    console.error('Server error:', error);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  // housekeeping
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp >= CACHE_EXPIRATION_MS) {
        console.log('Auto-Removing entry from cache', entry);
        cache.delete(key);
      }
    }
  }, CACHE_EXPIRATION_MS);
}

// Run the server
startServer().catch(console.error);
