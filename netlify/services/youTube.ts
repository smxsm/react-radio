const API_URL = 'https://www.googleapis.com/youtube/v3/search';
const API_KEY = Deno.env.get('YOUTUBE_API_KEY') || '';

export default async function youTubeSearch(searchTerm: string) {
  if (!searchTerm) return null;
  try {
    console.log('calling youtube');
    const res = await fetch(`${API_URL}?key=${API_KEY}&type=video&q=${searchTerm}`);
    const data = await res.json();
    if (!data.items?.length) {
      return null;
    }
    return `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
  } catch (err) {
    return null;
  }
}
