import { HttpException } from '@nestjs/common';

export class InvalidCredentialsException extends HttpException {
    constructor() {
        super('Invalid credentials', 401);
    }
}
