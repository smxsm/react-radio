declare module 'icecast-metadata-js' {
  export interface IcecastMetadata {
    StreamTitle?: string;
    TITLE?: string;
    [key: string]: string | undefined;
  }

  export interface IcecastMetadataEvent {
    metadata: IcecastMetadata;
  }

  export interface IcecastOptions {
    onMetadata: (event: IcecastMetadataEvent) => void;
    metadataTypes: string[];
    icyMetaInt: number;
  }

  export class IcecastReadableStream {
    constructor(response: Response, options: IcecastOptions);
  }
}
