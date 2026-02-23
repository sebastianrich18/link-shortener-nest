import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from './userRepository.interface';
import { AuthService } from './auth/auth.service';
import { PrismaUserRepository } from './user.repository';
import { LoginUserController, RegisterUserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth/auth.guard';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
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
        AuthGuard,
    ],
    exports: [AuthService, AuthGuard, UserRepository],
})
export class UserModule {}
