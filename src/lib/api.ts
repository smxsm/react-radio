const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to fetch');
  }
  return response.json();
}

// Helper function to create an AbortController with timeout
function createAbortController(timeoutMs: number = 10000): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

// Helper function to make fetch requests with timeout
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<T> {
  const controller = createAbortController(timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
    }
    throw error;
  }
}

export async function signup(email: string, firstName: string, lastName: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      firstName,
      lastName,
      password,
    }),
  });

  return handleResponse<{ user: User; session: Session }>(response);
}

export async function signin(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return handleResponse<{ user: User; session: Session }>(response);
}

export async function signout(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/auth/signout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionId}`,
    },
  });

  return handleResponse<{ success: boolean }>(response);
}

export async function forgotPassword(email: string) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  return handleResponse<{ resetLink: string }>(response);
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  return handleResponse<{ success: boolean }>(response);
}

export interface RadioStation {
  id: string;
  name: string;
  logo: string;
  listenUrl: string;
  isOwner?: boolean;
}

export async function getProfile(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    headers: {
      'Authorization': `Bearer ${sessionId}`,
    },
  });

  return handleResponse<{ user: User }>(response);
}

// Custom stations endpoints
export async function getCustomStations (sessionId: string, orderBy = 'created_at', order = 'DESC', retries = 2) {
  const attempt = async () => {
    return fetchWithTimeout<{ id: string; name: string; logo: string | null; listen_url: string }[]>(
      `${API_BASE_URL}/stations?orderBy=${orderBy}&order=${order}`,
      {
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      },
      15000 // Increase timeout to 15 seconds to match server
    );
  };

  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }
  throw lastError;
}

export async function getCustomStationById(sessionId: string, id: string) {
  const response = await fetch(`${API_BASE_URL}/stations/${id}`, {
    headers: {
      'Authorization': `Bearer ${sessionId}`,
    },
  });

  return handleResponse<{ id: string; name: string; logo: string | null; listen_url: string }>(response);
}

export async function addCustomStation(sessionId: string, station: { id: string; name: string; logo: string; listenUrl: string }) {
  const response = await fetch(`${API_BASE_URL}/stations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionId}`,
    },
    body: JSON.stringify({
      id: station.id,
      name: station.name,
      logo: station.logo,
      listen_url: station.listenUrl,
    }),
  });

  return handleResponse<{ id: string; name: string; logo: string | null; listen_url: string }>(response);
}

export interface TrackInfo {
  id: string;
  artist: string;
  title: string;
  album: string | null;
  releaseDate: Date | null;
  heardAt: Date | null;
  artwork: string | null;
  appleMusicUrl?: string;
  youTubeUrl?: string;
}

export interface TrackHistory extends TrackInfo {
  heardAt: Date;
}

export async function deleteCustomStation(sessionId: string, id: string) {
  const response = await fetch(`${API_BASE_URL}/stations/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${sessionId}`,
    },
  });

  return handleResponse<{ success: boolean }>(response);
}

// Track history endpoints
export async function getTrackHistory(sessionId: string, limit = 50) {
  const response = await fetch(`${API_BASE_URL}/tracks/history?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${sessionId}`,
    },
  });

  return handleResponse<TrackHistory[]>(response);
}

export async function addTrackToHistory(sessionId: string, trackInfo: TrackInfo) {
  const response = await fetch(`${API_BASE_URL}/tracks/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionId}`,
    },
    body: JSON.stringify({
      track_id: trackInfo.id,
    }),
  });

  return handleResponse<{ success: boolean }>(response);
}

export async function deleteTrackFromHistory(sessionId: string, trackId: string) {
  const response = await fetch(`${API_BASE_URL}/tracks/history/${trackId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${sessionId}`,
    },
  });

  return handleResponse<{ success: boolean }>(response);
}

export async function clearTrackHistory(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/tracks/history`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${sessionId}`,
    },
  });

  return handleResponse<{ success: boolean }>(response);
}

// Listen history endpoints
export async function getListenHistory(sessionId: string, limit = 50) {
  const response = await fetch(`${API_BASE_URL}/listen/history?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${sessionId}`,
    },
  });

  return handleResponse<RadioStation[]>(response);
}

export async function addStationToHistory(sessionId: string, station: RadioStation) {
  const response = await fetch(`${API_BASE_URL}/listen/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionId}`,
    },
    body: JSON.stringify({
      station_id: station.id,
      name: station.name,
      logo: station.logo,
      listen_url: station.listenUrl,
    }),
  });

  return handleResponse<{ success: boolean }>(response);
}

export async function deleteStationFromHistory(sessionId: string, stationId: string) {
  const response = await fetch(`${API_BASE_URL}/listen/history/${stationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${sessionId}`,
    },
  });

  return handleResponse<{ success: boolean }>(response);
}

export async function clearListenHistory(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/listen/history`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${sessionId}`,
    },
  });

  return handleResponse<{ success: boolean }>(response);
}
