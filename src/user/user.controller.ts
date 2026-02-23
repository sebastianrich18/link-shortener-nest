import { AuthService } from 'src/user/auth/auth.service';
import { UserRepository } from './user.repository.interface';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Role, PostUserDto } from './user.dto';
import { InvalidCredentialsException } from './auth/auth.exception';

@Controller('register')
export class RegisterUserController {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly authService: AuthService,
    ) {}

    @Post()
    async createUser(@Body() createUserDto: PostUserDto): Promise<{ token: string }> {
        const passwordHash = await this.authService.hashPassword(createUserDto.passwordClearText);
        const createdUser = await this.userRepository.create({
            email: createUserDto.email,
            passwordHash,
            role: Role.USER, // admins must be created manually in the database for now
        });

        const token = await this.authService.generateToken(createdUser.id, Role.USER);

        return { token };
    }
}

@Controller('login')
export class LoginUserController {
    constructor(
        private readonly authService: AuthService,
        private readonly userRepository: UserRepository,
    ) {}

    @Post()
    @HttpCode(200)
    async loginUser(@Body() createUserDto: PostUserDto): Promise<{ token: string }> {
        const isValid = await this.authService.validateUserLoginCredentials(
            createUserDto.email,
            createUserDto.passwordClearText,
        );
        if (!isValid) {
            throw new InvalidCredentialsException();
        }

        const user = await this.userRepository.findByEmail(createUserDto.email);
        const token = await this.authService.generateToken(user.id, user.role);
        return { token };
    }
}
