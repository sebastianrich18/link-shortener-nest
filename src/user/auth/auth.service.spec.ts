import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepository } from './../userRepository.interface';
import { InMemoryUserRepository } from './../user.repository';
import { JwtModule } from '@nestjs/jwt';
import { Role } from '../user.dto';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                JwtModule.register({
                    secret: 'JWT_SECRET',
                    signOptions: { expiresIn: '1h' },
                }),
            ],
            providers: [AuthService, { provide: UserRepository, useClass: InMemoryUserRepository }],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should hash the password correctly', async () => {
        const password = 'mysecretpassword';
        const hash = await service.hashPassword(password);
        expect(hash).not.toBe(password);
        expect(hash).toMatch(/^\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+={0,2}\$[A-Za-z0-9+/]+={0,2}$/);
    });

    it('should validate user login credentials correctly', async () => {
        const email = 'user@example.com';
        const password = 'mysecretpassword';
        const hash = await service.hashPassword(password);
        await service['userRepository'].create({
            email,
            passwordHash: hash,
            role: Role.USER,
        });
        expect(await service.validateUserLoginCredentials(email, password)).toBeTruthy();
        expect(await service.validateUserLoginCredentials(email, 'wrongpassword')).toBeFalsy();
        expect(await service.validateUserLoginCredentials('wrongemail@example.com', password)).toBeFalsy();
    });

    it('should generate and verify JWT tokens correctly', async () => {
        const userId = 1;
        const role = Role.USER;
        const token = await service.generateToken(userId, role);
        expect(token).toBeDefined();

        const payload = await service.verifyToken(token);
        expect(payload.sub).toBe(userId);
        expect(payload.role).toBe(role);
    });

    it('should throw an error for invalid JWT tokens', async () => {
        await expect(service.verifyToken('invalidtoken')).rejects.toThrow();
    });

    it('should throw an error for expired JWT tokens', async () => {
        const userId = 1;
        const role = Role.USER;
        const token = await service.generateToken(userId, role);

        // mock the jwtService to simulate an expired token
        jest.spyOn(service['jwtService'], 'verifyAsync').mockRejectedValue(new Error('TokenExpiredError'));

        await expect(service.verifyToken(token)).rejects.toThrow();
    });
});
