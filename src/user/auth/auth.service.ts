import { Injectable, Logger } from '@nestjs/common';
import { Role, User } from 'src/user/user.dto';
import { UserRepository } from 'src/user/userRepository.interface';
import { UserNotFoundByEmailException } from 'src/user/user.exception';
import * as argon2 from 'argon2'; // https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
import { JwtService } from '@nestjs/jwt';
import { InvalidCredentialsException } from './auth.exception';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
    ) {}

    async validateUserLoginCredentials(email: string, clearTextPassword: string): Promise<boolean> {
        let user: User;
        try {
            user = await this.userRepository.findByEmail(email);
        } catch (e: unknown) {
            if (e instanceof UserNotFoundByEmailException) {
                // catch to avoid leaking information about which emails are registered
                return false;
            }
            this.logger.error(`Error validating user login credentials for email: ${email}`, e);
            throw e;
        }

        if (!(await argon2.verify(user.passwordHash, clearTextPassword))) {
            this.logger.warn(`Invalid login attempt for email: ${email}`);
            return false;
        }

        return true;
    }

    async hashPassword(clearTextPassword: string): Promise<string> {
        return await argon2.hash(clearTextPassword);
    }

    async generateToken(userId: number, role: Role): Promise<string> {
        const payload = { sub: userId, role };
        return await this.jwtService.signAsync(payload);
    }

    async verifyToken<T extends object = { sub: string; role: string }>(token: string): Promise<T> {
        try {
            return await this.jwtService.verifyAsync(token);
        } catch (e) {
            this.logger.warn(`Invalid JWT token: ${token}`, e);
            throw new InvalidCredentialsException();
        }
    }
}
