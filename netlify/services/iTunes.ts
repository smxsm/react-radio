import Fuse from 'https://deno.land/x/fuse@v6.4.1/dist/fuse.esm.min.js';

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
    if (!searchTerm) {
      return null;
    }
    const res = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=song`);
    const data = (await res.json())?.results;
    if (!data?.length) {
      return null;
    }
    // Using Fuse.js to select best match
    let fuse = new Fuse(
      data.map(({ artistName, trackName, collectionName }) => `${artistName} ${trackName} ${collectionName}`),
      { useExtendedSearch: true }
    );
    // First run trying to filter out collection albums
    let searchResults = fuse.search(`${searchTerm} !greatest !best !hits !essential !single !live`);
    if (!searchResults.length) {
      // If furst run found nothing, try againt without considering album type
      fuse = new Fuse(data.map(({ artistName, trackName }) => `${artistName} ${trackName}}`));
      searchResults = fuse.search(searchTerm);
    }
    if (!searchResults.length) {
      return null;
    }
    const [{ refIndex }] = searchResults;
    return {
      artist: data[refIndex].artistName || '',
      title: data[refIndex].trackName || '',
      album: data[refIndex].collectionName || '',
      releaseDate: new Date(data[refIndex].releaseDate) || null,
      artwork: data[refIndex].artworkUrl100,
      appleMusicUrl: data[refIndex].trackViewUrl,
    };
  } catch (err) {
    return null;
  }
}
