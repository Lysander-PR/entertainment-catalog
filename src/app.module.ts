import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksModule } from './books/books.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '',
      port: 1111,
      username: '',
      password: '',
      database: '',
      autoLoadEntities: true,
      synchronize: true,
    }),
    BooksModule,
  ],
  providers: [],
})
export class AppModule {}
