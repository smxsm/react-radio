import { IcecastReadableStream } from 'https://unpkg.com/icecast-metadata-js';

const getIcecastMetadata = async (response: Response, icyMetaInt: number) =>
  new Promise((resolve) => {
    new IcecastReadableStream(response, {
      onMetadata: ({ metadata: { StreamTitle: title } }) => {
        resolve({ title });
      },
      onError: () => resolve({}),
      metadataTypes: ['icy', 'ogg'],
      icyMetaInt,
    });
  });

const edge = async (req: Request) => {
  const url = new URL(req.url).searchParams.get('url') || '';
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Icy-MetaData': '1',
      },
    });
    const icyMetaInt = parseInt(res.headers.get('Icy-MetaInt') || '16000');

    const data = await getIcecastMetadata(res, icyMetaInt);
    return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({}), { headers: { 'content-type': 'application/json' } });
  }
};

export default edge;
export const config = { path: '/station-metadata' };
