import Fuse from 'fuse.js';

export type TrackInfo = {
  artist: string;
  title: string;
  album: string;
  releaseDate: Date | null;
  artwork: string;
  appleMusicUrl: string;
  youTubeUrl?: string;
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
      data.map(
        ({ artistName, trackName, collectionName, collectionArtistName }) =>
          `${artistName} ${trackName} ${collectionArtistName} ${collectionName}`
      ),
      { useExtendedSearch: true }
    );
    
    // First run trying to filter out collection albums
    let searchResults = fuse.search(
      `${searchTerm} !greatest !ultimate !collection !best !hits !essential !single !live !various`
    );
    
    if (!searchResults.length) {
      // If first run found nothing, try again without considering album type
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
