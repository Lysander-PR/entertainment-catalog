import {
  SeedAlbum,
  SeedBook,
  SeedData,
  SeedMovie,
} from '@/seed/types/interfaces/seed.interface';

const initialGenres: string[] = [
  'rock',
  'pop',
  'jazz',
  'classical',
  'electronic',
  'hip hop',
  'r&b',
  'country',
  'reggae',
  'blues',
  'metal',
  'indie',
  'alternative',
  'folk',
  'soul',
  'funk',
  'disco',
  'house',
  'techno',
  'ambient',
  'electro swing',
  'jazzy hip-hop',
  'flamenco',
];

const initialAlbums: SeedAlbum[] = [
  {
    artist: 'boogie belgique',
    studio: 'cold busted',
    releaseDate: new Date('2012-07-02'),
    album: 'blueberry hill',
    coverPath: 'albums/bogie-belgique-blueberry_hill.jpg',
    songs: [
      {
        title: 'dance with the democrat',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'stairway to the ussr',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'once have i',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'oh lord',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'the little white duck',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'black train',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'drop out',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'the getaway',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'moriarty',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'the ogres',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'boogieman penthouse',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'blueberry hill',
        composer: 'oswald cromheecke',
        genre: 'jazzy hip-hop',
      },
    ],
  },
  {
    artist: 'bøjet',
    studio: 'independent',
    releaseDate: new Date('2017-09-03'),
    album: 'sleepwalk',
    coverPath: 'albums/bojet-sleepwalk.jpg',
    songs: [
      {
        title: 'sleepwalk',
        composer: 'bøjet',
        genre: 'electronic',
      },
      {
        title: 'holding hands with you',
        composer: 'bøjet',
        genre: 'electronic',
      },
      {
        title: "i wasn't enough for you",
        composer: 'bøjet',
        genre: 'electronic',
      },
      {
        title: "i'm so alone",
        composer: 'bøjet',
        genre: 'electronic',
      },
      {
        title: "i'm too afraid to fall in love",
        composer: 'bøjet',
        genre: 'electronic',
      },
      {
        title: "it's not you it's me",
        composer: 'bøjet',
        genre: 'electronic',
      },
      {
        title: 'lost',
        composer: 'bøjet',
        genre: 'electronic',
      },
      {
        title: "you don't have to worry",
        composer: 'bøjet',
        genre: 'electronic',
      },
      {
        title: 'kaiyo',
        composer: 'bøjet',
        genre: 'electronic',
      },
      {
        title: 'hey there pretty eyes',
        composer: 'bøjet',
        genre: 'electronic',
      },
    ],
  },
  {
    artist: 'tusken',
    studio: 'independent',
    releaseDate: new Date('2015-09-06'),
    album: 'interrupt 5 - EP',
    coverPath: 'albums/tusken-interrupt-5.jpg',
    songs: [
      {
        title: 'lava',
        composer: 'michael stapel',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'emb',
        composer: 'michael stapel',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'cloudz',
        composer: 'michael stapel',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'wons II',
        composer: 'michael stapel',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'mo',
        composer: 'michael stapel',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'yobaca',
        composer: 'michael stapel',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'strange world',
        composer: 'michael stapel',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'dusty',
        composer: 'michael stapel',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'mocean',
        composer: 'michael stapel',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'monaygeta',
        composer: 'michael stapel',
        genre: 'jazzy hip-hop',
      },
      {
        title: 'wons',
        composer: 'michael stapel',
        genre: 'jazzy hip-hop',
      },
    ],
  },
  {
    artist: 'rodrigo y gabriela',
    studio: 'riverside studios',
    releaseDate: new Date('2006-10-03'),
    album: 'rodrigo y gabriela',
    coverPath: 'albums/rodrigo-y-gabriela.jpg',
    songs: [
      {
        title: 'tamacun',
        composer: 'rodrigo y gabriela',
        genre: 'flamenco',
      },
      {
        title: 'diablo rojo',
        composer: 'rodrigo y gabriela',
        genre: 'flamenco',
      },
      {
        title: 'vikingman',
        composer: 'rodrigo y gabriela',
        genre: 'flamenco',
      },
      {
        title: 'satori',
        composer: 'rodrigo y gabriela',
        genre: 'flamenco',
      },
      {
        title: 'ixtapa',
        composer: 'rodrigo y gabriela',
        genre: 'flamenco',
      },
      {
        title: 'stairway to heaven',
        composer: 'rodrigo y gabriela',
        genre: 'flamenco',
      },
      {
        title: 'orion',
        composer: 'rodrigo y gabriela',
        genre: 'flamenco',
      },
      {
        title: 'juan loco',
        composer: 'rodrigo y gabriela',
        genre: 'flamenco',
      },
      {
        title: 'PPA',
        composer: 'rodrigo y gabriela',
        genre: 'flamenco',
      },
    ],
  },
  {
    artist: 'john murphy',
    studio: 'fox searchlight pictures',
    releaseDate: new Date('2013-11-11'),
    album: 'in the house - in a heartbeat',
    coverPath: 'albums/john-murphy-in-the-house-in-a-heartbeat.jpg',
    songs: [
      {
        title: 'in the house - in a heartbeat',
        composer: 'john murphy',
        genre: 'rock',
      },
    ],
  },
];

const initialBooks: SeedBook[] = [
  {
    author: 'guillermo arriaga',
    title: 'el hombre',
    publisher: 'alfaguara',
    coverPath: 'books/guillermo_arriaga_el_hombre.jpg',
    releaseDate: new Date('2025-05-12'),
  },
  {
    author: 'guillermo arriaga',
    title: 'el salvaje',
    publisher: 'alfaguara',
    releaseDate: new Date('2016-10-01'),
    coverPath: 'books/guillermo-arriaga-el-salvaje.jpg',
  },
  {
    author: 'guillermo arriaga',
    title: 'salvar el fuego',
    publisher: 'alfaguara',
    releaseDate: new Date('2020-03-19'),
    coverPath: 'books/guillermo-arriaga-salvar-el-fuego.jpg',
  },
  {
    author: 'john katzenbach',
    title: 'the analyst',
    publisher: 'ballantine books',
    releaseDate: new Date('2002-01-29'),
    coverPath: 'books/john-katzenbach-the-analyst.jpg',
  },
  {
    author: 'franz kafka',
    title: 'the metamorphosis',
    publisher: 'penguin classics',
    releaseDate: new Date('1915-10-01'),
    coverPath: 'books/franz-kafka-the-metamorphosis.jpg',
  },
];

const initialMovies: SeedMovie[] = [
  {
    title: 'camino a la redencion',
    director: 'guillermo arriaga',
    protagonist: 'jennifer lawrence',
    studio: 'wild bunch',
    writer: 'guillermo arriaga',
    releaseDate: new Date('2010-07-23'),
    coverPath: 'movies/guillermo-arriaga-the-burning-plain-poster.jpg',
  },
  {
    title: 'babel',
    director: 'guillermo arriaga',
    protagonist: 'brad pitt',
    studio: 'central films',
    writer: 'guillermo arriaga',
    releaseDate: new Date('2006-11-10'),
    coverPath: 'movies/guillermo-arriaga-babel.jpg',
  },
  {
    title: 'prisioners',
    director: 'denis villeneuve',
    protagonist: 'hugh jackman',
    studio: 'warner bros.',
    writer: 'aaron guzikowski',
    releaseDate: new Date('2013-11-08'),
    soundtrack:
      'https://open.spotify.com/album/5MdxtYNgZJiZMegeZ3Qe1U?si=CQ7Tp7PnQ2SXtvMhioaITQ',
    coverPath: 'movies/denis-villeneuve-prisoners.jpg',
  },
  {
    title: 'cloverfield',
    director: 'matt reeves',
    protagonist: 'michael stahl-david',
    studio: 'paramount pictures',
    writer: 'drew goddard',
    releaseDate: new Date('2008-01-18'),
    coverPath: 'movies/matt-reeves-cloverfield.jpg',
  },
  {
    title: 'alien',
    director: 'ridley scott',
    protagonist: 'sigourney weaver',
    studio: '20th century fox',
    writer: "dan o'bannon",
    releaseDate: new Date('1979-05-25'),
    soundtrack:
      'https://open.spotify.com/album/2ubcKYeOHGJ5UHHNBAuaKb?si=8coGNTdZTH2WzKg7Oa7mMw',
    coverPath: 'movies/ridley-scott-alien.jpg',
  },
];

export const initialData: SeedData = {
  genres: initialGenres,
  albums: initialAlbums,
  books: initialBooks,
  movies: initialMovies,
};
