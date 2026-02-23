import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../user.repository.interface';
import { AuthService } from './auth.service';
import { AuthTokenPayload } from './authToken.interface';
import { AuthenticatedRequest } from './authenticatedRequest.interface';

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);

    constructor(
        private readonly authService: AuthService,
        private readonly userRepository: UserRepository,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            const payload = await this.authService.verifyToken<AuthTokenPayload>(token);
            const user = await this.userRepository.findById(parseInt(payload.sub));

            // attach user to request for later use in controllers via @CurrentUser decorator
            request.user = {
                id: user.id,
                email: user.email,
                role: user.role,
            };

            return !!user;
        } catch (e) {
            this.logger.warn('Invalid JWT token: ', e);
            throw new UnauthorizedException();
        }
    }

    private extractTokenFromHeader(request: AuthenticatedRequest): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
