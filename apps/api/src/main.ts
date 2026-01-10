import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Simple dev-time CORS to validate FE<->BE connectivity.
  app.enableCors();

  // Avoid port conflict with Next.js dev server (default 3000).
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
