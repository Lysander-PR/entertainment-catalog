export interface SeedSong {
  composer: string;
  title: string;
  guestArtist?: string;
  genre: string;
}

export interface SeedWithCover {
  coverPath?: string;
}

export interface SeedAlbum extends SeedWithCover {
  album: string;
  releaseDate: Date;
  studio: string;
  artist: string;
  songs: SeedSong[];
}

export interface SeedBook extends SeedWithCover {
  author: string;
  coWriter?: string;
  title: string;
  releaseDate: Date;
  publisher: string;
}

export interface SeedMovie extends SeedWithCover {
  director: string;
  title: string;
  writer: string;
  studio: string;
  protagonist: string;
  releaseDate: Date;
  soundtrack?: string;
}

export interface SeedData {
  genres: string[];
  albums: SeedAlbum[];
  books: SeedBook[];
  movies: SeedMovie[];
}
