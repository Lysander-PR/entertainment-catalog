export interface SeedSong {
  composer: string;
  title: string;
  guestArtist?: string;
  genre: string;
}

export interface SeedAlbum {
  album: string;
  releaseDate: Date;
  studio: string;
  artist: string;
  songs: SeedSong[];
  coverUrl?: string;
}

export interface SeedBook {
  author: string;
  coWriter?: string;
  title: string;
  releaseDate: Date;
  publisher: string;
  coverUrl?: string;
}

export interface SeedMovie {
  director: string;
  title: string;
  writer: string;
  studio: string;
  protagonist: string;
  releaseDate: Date;
  soundtrack?: string;
  coverUrl?: string;
}

export interface SeedData {
  genres: string[];
  albums: SeedAlbum[];
  books: SeedBook[];
  movies: SeedMovie[];
}
