export default async function youTubeSearch(searchTerm: string) {
  if (!searchTerm) return null;
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${searchTerm}`);
    const html = await res.text();
    const match = html.match(/(?:"videoId":")(?<videoId>.*?)(?:")/)?.groups;
    if (!match?.videoId) {
      return null;
    }
    return `https://www.youtube.com/watch?v=${match.videoId}`;
  } catch (err) {
    return null;
  }
}
