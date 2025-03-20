import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  const configService = app.get(ConfigService);
  let port = configService.get<number>("PORT") || 3001;

  // Try to listen on the port, if it fails, increment and try again

  try {
    await app.listen(port);

    console.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    console.log(`Port ${port} is in use`);
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}
bootstrap();
