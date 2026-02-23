import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from './user.repository.interface';
import { AuthService } from './auth/auth.service';
import { PrismaUserRepository } from './user.repository';
import { LoginUserController, RegisterUserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        JwtModule.registerAsync({
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1h' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [RegisterUserController, LoginUserController],
    providers: [
        {
            provide: UserRepository,
            useClass: PrismaUserRepository,
        },
        AuthService,
    ],
    exports: [AuthService, UserRepository],
})
export class UserModule {}
