export type TrackInfo = {
    artist: string;
    title: string;
    album: string;
    releaseDate: Date | null;
    artwork: string;
    appleMusicUrl?: string;
    spotifyUrl: string;
    youTubeUrl?: string;
};
export interface SpotifyItem {
    album: {
        album_type: string;
        total_tracks: number;
        available_markets: string[];
        external_urls: {
            spotify: string;
        };
        href: string;
        id: string;
        images: Array<{
            url: string;
            height: number;
            width: number;
        }>;
        name: string;
        release_date: string;
        release_date_precision: string;
        type: string;
        uri: string;
        artists: Array<{
            external_urls: {
                spotify: string;
            };
            href: string;
            id: string;
            name: string;
            type: string;
            uri: string;
        }>;
        is_playable: boolean;
    };
    artists: Array<{
        external_urls: {
            spotify: string;
        };
        href: string;
        id: string;
        name: string;
        type: string;
        uri: string;
    }>;
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: {
        isrc: string;
    };
    external_urls: {
        spotify: string;
    };
    href: string;
    id: string;
    is_playable: boolean;
    name: string;
    popularity: number;
    preview_url: string | null;
    track_number: number;
    type: string;
    uri: string;
    is_local: boolean;
}
export interface iTunesItem {
    artistName: string;
    trackName: string;
    collectionName: string;
    collectionArtistName: string;
}

export type IcyAudioInfo = {
    bitRate: number;
    quality: number;
    channels: number;
    sampleRate: number;
};

export type StreamHeaders = {
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
export type StationMetadata = {
    title: string;
} & StreamHeaders;

export type UnicodeConverter = {
    fix: (text: string) => string;
    load: (start: number, end: number) => void;
};

export interface MatchedTrack {
    id: string;
    artist: string;
    title: string;
    album: string | null;
    releaseDate: string | null;
    artwork: string | null;
    appleMusicUrl: string;
    youTubeUrl: string;
    spotifyUrl: string;
}
export interface Track {
    id: string;
    artist: string;
    title: string;
    album: string | null;
    release_date: string | null;
    artwork: string | null;
    apple_music_url: string;
    youtube_url: string;
    spotify_url: string;
    created_at: string | Date;
    // "virtual" properties to convert from db fields
    heardAt?: string | Date;
    appleMusicUrl: string;
    youTubeUrl: string;
    spotifyUrl: string;
    // Add other properties that exist on your track objects
}
export interface MetadataResponse {
    stationMetadata: StationMetadata;
    matchedTrack?: MatchedTrack;
}
export interface CacheEntry {
    url: string;
    data: MetadataResponse;
    timestamp: number;
}
