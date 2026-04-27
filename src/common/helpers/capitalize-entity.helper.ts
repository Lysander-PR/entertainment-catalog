import { capitalize } from './capitalize.helper';

import { Song } from '@/songs/entities/song.entity';
import { Movie } from '@/movies/entities/movie.entity';
import { Book } from '@/books/entities/book.entity';
import { Album } from '@/albums/entities/album.entity';

export function capitalizeSong(songLike: Partial<Song>): Partial<Song> {
  return {
    ...songLike,
    composer: songLike.composer ? capitalize(songLike.composer) : undefined,
    title: songLike.title ? capitalize(songLike.title) : undefined,
    guestArtist: songLike.guestArtist
      ? capitalize(songLike.guestArtist)
      : undefined,
  };
}

export function capitalizeMovie(likeMovie: Partial<Movie>): Partial<Movie> {
  return {
    ...likeMovie,
    director: likeMovie.director ? capitalize(likeMovie.director) : undefined,
    title: likeMovie.title ? capitalize(likeMovie.title) : undefined,
    writer: likeMovie.writer ? capitalize(likeMovie.writer) : undefined,
    studio: likeMovie.studio ? capitalize(likeMovie.studio) : undefined,
    protagonist: likeMovie.protagonist
      ? capitalize(likeMovie.protagonist)
      : undefined,
  };
}

export function capitalizeBook(book: Partial<Book>): Partial<Book> {
  return {
    ...book,
    author: book.author ? capitalize(book.author) : undefined,
    title: book.title ? capitalize(book.title) : undefined,
    publisher: book.publisher ? capitalize(book.publisher) : undefined,
    coWriter: book.coWriter ? capitalize(book.coWriter) : undefined,
  };
}

export function capitalizeAlbum(likeAlbum: Partial<Album>): Partial<Album> {
  return {
    ...likeAlbum,
    album: likeAlbum.album ? capitalize(likeAlbum.album) : undefined,
    studio: likeAlbum.studio ? capitalize(likeAlbum.studio) : undefined,
    artist: likeAlbum.artist ? capitalize(likeAlbum.artist) : undefined,
  };
}
