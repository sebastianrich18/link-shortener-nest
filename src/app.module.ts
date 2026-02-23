import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { LinkModule } from './link/link.module';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
// import { DevtoolsModule } from '@nestjs/devtools-integration';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        // DevtoolsModule.register({
        //     http: process.env.NODE_ENV === 'local',
        // }),
        LinkModule,
        UserModule,
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
    ],
})
export class AppModule {}
