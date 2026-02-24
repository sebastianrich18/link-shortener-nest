import { InvalidCredentialsException } from './auth/auth.exception';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { UserRepository } from './user.repository.interface';
import { AuthService } from 'src/user/auth/auth.service';
import { Role, PostUserDto, User } from './user.dto';
import {
    ApiOperation,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiConflictResponse,
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
    ApiTags,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('register')
export class RegisterUserController {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly authService: AuthService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Register a new user' })
    @ApiCreatedResponse({ description: 'User registered successfully, returns JWT token' })
    @ApiBadRequestResponse({ description: 'Invalid email or password too short' })
    @ApiConflictResponse({ description: 'User with this email already exists' })
    async createUser(@Body() createUserDto: PostUserDto): Promise<{ token: string }> {
        const passwordHash = await this.authService.hashPassword(createUserDto.passwordClearText);
        const createdUser: User = await this.userRepository.create({
            email: createUserDto.email,
            passwordHash,
            role: Role.USER, // admins must be created manually in the database for now
        });

        const token = await this.authService.generateToken(createdUser.id, createdUser.role);

        return { token };
    }
}

@ApiTags('Auth')
@Controller('login')
export class LoginUserController {
    constructor(
        private readonly authService: AuthService,
        private readonly userRepository: UserRepository,
    ) {}

    @Post()
    @HttpCode(200)
    @ApiOperation({ summary: 'Login with existing credentials' })
    @ApiOkResponse({ description: 'Login successful, returns JWT token' })
    @ApiBadRequestResponse({ description: 'Invalid email or password format' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
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
