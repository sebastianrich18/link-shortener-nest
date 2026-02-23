import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        // snapshot: true,
    });
    const config = new DocumentBuilder()
        .setTitle('Link Shortener API')
        .setDescription('API for a simple link shortener service')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
    console.error('Error starting the application:', err);
    process.exit(1);
});
