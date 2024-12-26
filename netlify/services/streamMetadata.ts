import { IcecastReadableStream } from 'icecast-metadata-js';

type IcyAudioInfo = {
  bitRate: number;
  quality: number;
  channels: number;
  sampleRate: number;
};

type StreamHeaders = {
  server: string;
  icyGenre: string[];
  icyAudioInfo: IcyAudioInfo;
  icyName: string;
  icyDescription: string;
  icyUrl: string;
  icyBr: number;
  icySr: number;
  icyLogo: string;
  icyCountryCode: string;
  icyCountrySubdivisionCode: string;
  icyLanguageCodes: string[];
  icyGeoLatLong: string;
  contentType: string;
};

type StationMetadata = {
  title: string;
} & StreamHeaders;

type UnicodeConverter = {
  fix: (text: string) => string;
  load: (start: number, end: number) => void;
};

export default async function getIcecastMetadata(response: Response, icyMetaInt: number): Promise<StationMetadata> {
  const icyHeaders = parseHeaders(response.headers);
  return new Promise((resolve) => {
    new IcecastReadableStream(response, {
      onMetadata: ({ metadata }) => {
        const title = metadata?.StreamTitle || metadata?.TITLE || '';
        resolve({ title: title.trim(), ...icyHeaders });
      },
      metadataTypes: ['icy', 'ogg'],
      icyMetaInt: icyMetaInt,
    });
  });
}

function parseHeaders(headers: Headers): StreamHeaders {
  const unicode = unicodeConverter();
  unicode.load(880, 1791);
  return {
    server: headers.get('Server') || '',
    icyGenre: splitValues(headers.get('icy-genre') || '', ','),
    icyAudioInfo: parseAudioInfoString(headers.get('icy-audio-info') || headers.get('ice-audio-info') || ''),
    icyName: unicode.fix(headers.get('icy-name') || '').trim() || '',
    icyDescription: unicode.fix(headers.get('icy-description') || '').trim(),
    icyUrl: reconstructUrl(headers.get('icy-url')?.trim() || ''),
    icyBr: parseInt(headers.get('icy-br') || '0'),
    icySr: parseInt(headers.get('icy-sr') || '0'),
    icyLogo: headers.get('icy-logo')?.trim() || '',
    icyCountryCode: headers.get('icy-country-code')?.trim() || '',
    icyCountrySubdivisionCode: headers.get('icy-country-subdivison-code')?.trim() || '',
    icyLanguageCodes: splitValues(headers.get('icy-language-codes') || '', ','),
    icyGeoLatLong: headers.get('icy-geo-lat-long') || '',
    contentType: headers.get('Content-Type') || '',
  };
}

function splitValues(values: string, separator: string): string[] {
  return values.split(separator).map((genre) => genre.trim()) || [];
}

function parseAudioInfoString(audioInfo: string): IcyAudioInfo {
  const keyValueTupels = audioInfo.split(';').map((entry) => entry.split('='));
  const result: IcyAudioInfo = {
    bitRate: 0,
    quality: 0,
    channels: 0,
    sampleRate: 0
  };

  for (let [key, value] of keyValueTupels) {
    if (key.toLocaleLowerCase().includes('bitrate')) {
      result.bitRate = parseInt(value.trim()) || 0;
    }
    if (key.toLocaleLowerCase().includes('quality')) {
      result.quality = parseFloat(value.trim()) || 0;
    }
    if (key.toLocaleLowerCase().includes('channels')) {
      result.channels = parseInt(value.trim()) || 0;
    }
    if (key.toLocaleLowerCase().includes('samplerate')) {
      result.sampleRate = parseInt(value.trim()) || 0;
    }
  }

  return result;
}

function reconstructUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch (err) {
    return url;
  }
}

function unicodeConverter(): UnicodeConverter {
  let unicodeMap: { [key: string]: string } = {};

  const a = (text: string, map: { [key: string]: string }): string => {
    for (let i = 0; i < text.length; i++) {
      if (i + 2 < text.length) {
        const triple = text.charAt(i) + text.charAt(i + 1) + text.charAt(i + 2);
        if (triple in map) {
          text = text.replace(triple, map[triple]);
          i += 2;
        }
      }
      if (i + 1 < text.length) {
        const pair = text.charAt(i) + text.charAt(i + 1);
        if (pair in map) {
          text = text.replace(pair, map[pair]);
          i++;
        }
      }
      if (text.charAt(i) in map) {
        text = text.replace(text.charAt(i), map[text.charAt(i)]);
      }
    }
    return text;
  };

  const g = (code: number): string | false => {
    if (code < 128) {
      return String.fromCharCode(code);
    } else if (code < 2048) {
      const k = 192 + Math.floor(code / 64);
      const j = 128 + (code % 64);
      return String.fromCharCode(k) + String.fromCharCode(j);
    } else if (code < 65536) {
      const k = 224 + Math.floor(code / 4096);
      const j = 128 + Math.floor((code % 4096) / 64);
      const h = 128 + (code % 64);
      return String.fromCharCode(k) + String.fromCharCode(j) + String.fromCharCode(h);
    }
    return false;
  };

  const c = (map: { [key: string]: string }, start: number, end: number): { [key: string]: string } => {
    for (let j = start; j <= end; j++) {
      if (j > 65535) break;
      const k = String.fromCharCode(j);
      const mapped = g(j);
      if (k && mapped) {
        map[k] = mapped;
      }
    }
    return map;
  };

  return {
    fix: (text: string): string => {
      while (text !== a(text, unicodeMap)) {
        text = a(text, unicodeMap);
      }
      return text;
    },
    load: (start: number, end: number): void => {
      unicodeMap = c(unicodeMap, start, end);
    }
  };
}
