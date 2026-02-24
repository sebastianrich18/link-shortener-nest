import { LoginUserController, RegisterUserController } from './user.controller';
import { UserRepository } from './user.repository.interface';
import { PrismaUserRepository } from './user.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthService } from './auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

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
