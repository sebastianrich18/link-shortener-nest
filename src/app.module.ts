import { createAdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { ZodValidationPipe } from 'nestjs-zod';
import { LinkModule } from './link/link.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ...(process.env.NODE_ENV !== 'test' ? [createAdminModule()] : []),
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
