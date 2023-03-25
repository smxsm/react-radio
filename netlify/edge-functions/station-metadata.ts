import getIcecastMetadata from '../services/streamMetadata.ts';

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

    const data = await getIcecastMetadata(res, icyMetaInt);
    return new Response(JSON.stringify(data), { headers: responseHeaders });
  } catch (err) {
    return new Response(JSON.stringify({}), { headers: responseHeaders });
  }
};

export default edge;
export const config = { path: '/station-metadata' };
