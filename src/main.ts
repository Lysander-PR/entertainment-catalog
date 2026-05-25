import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { APP_PREFIX } from './common/types/consts/app-prefix.const';
import { envs, isProd } from './config/envs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(APP_PREFIX);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Entertainment Catalog API')
    .setDescription('The entertainment catalog API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(APP_PREFIX, app, documentFactory);

  await app.listen(envs.PORT);

  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.debug('We are in Prod?' + isProd);
}
bootstrap();
