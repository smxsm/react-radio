import { createClient } from '@supabase/supabase-js';

interface ListOptions {
  limit: number;
  sort: string;
  order: number;
}

// Create a single supabase client for interacting with your database
const supabase = createClient(
  'https://iddsgsocgqklrqeuykzn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZHNnc29jZ3FrbHJxZXV5a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc4NjcxMzMsImV4cCI6MTk5MzQ0MzEzM30.4mE0-3D3KoMbV1jFEupgxfPqA9Y2ViNkIY5YaNhLb34'
);

const defaultListOptions = { limit: 60, sort: '', order: 1 };

export async function getAllStations(options: ListOptions = defaultListOptions) {
  try {
    // const { data } = await supabase.from('stations').select('*').contains('countries', ['BG']);
    // const res = await fetch(
    //   'http://de1.api.radio-browser.info/json/stations/bycountrycodeexact/bg?order=clicktrend&reverse=true&limit=2000'
    // );
    const res = await fetch('/stations.json');

    const stations = (await res.json()) as {
      stationuuid: string;
      name: string;
      favicon: string;
      url_resolved: string;
    }[];

    const data = stations.map(({ stationuuid, name, favicon, url_resolved }) => ({
      id: stationuuid,
      name,
      logo: favicon,
      listenUrl: url_resolved,
    }));

    return data;
  } catch (err) {
    return [];
  }
}
