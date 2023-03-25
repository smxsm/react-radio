type TrackInfo = {
  artist: string;
  title: string;
  album: string;
  releaseDate: Date | null;
  artwork: string;
  appleMusicUrl: string;
};

export default async function iTunesSearch(searchTerm: string): Promise<TrackInfo | null> {
  try {
    const filterTerms = ['ft', 'feat', 'vs'];
    const cleanedSearchTerm = searchTerm
      .match(/\w+(?![^(]*\))/g)
      ?.filter((term) => !filterTerms.includes(term.toLowerCase()))
      .join(' ');
    if (!cleanedSearchTerm) {
      return null;
    }
    const res = await fetch(`https://itunes.apple.com/search?term=${cleanedSearchTerm}&entity=musicTrack`);
    const data = await res.json();
    if (!data.resultCount) {
      return null;
    }
    // TODO Implement some kind of matching algorithm instead of taking the first result
    return {
      artist: data.results[0].artistName || '',
      title: data.results[0].trackName || '',
      album: data.results[0].collectionName || '',
      releaseDate: new Date(data.results[0].releaseDate) || null,
      artwork: data.results[0].artworkUrl100,
      appleMusicUrl: data.results[0].trackViewUrl,
    };
  } catch (err) {
    return null;
  }
}
