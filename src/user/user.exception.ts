import { HttpException } from '@nestjs/common';

export class UserConflictException extends HttpException {
    constructor(userEmail: string) {
        super(`User with email ${userEmail} already exists`, 409);
    }
}

export class UserNotFoundByEmailException extends HttpException {
    constructor(userEmail: string) {
        super(`User with email ${userEmail} not found`, 404);
    }
}

export class UserNotFoundByIdException extends HttpException {
    constructor(userId: number) {
        super(`User with id ${userId} not found`, 404);
    }
}
