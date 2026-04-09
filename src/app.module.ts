import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: '',
      host: '',
      port: 1111,
      username: '',
      password: '',
      database: '',
      autoLoadEntities: true,
      synchronize: false,
    }),
  ],
  providers: [],
})
export class AppModule {}
