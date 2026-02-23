import { HttpException } from '@nestjs/common';

export class LinkNotFoundException extends HttpException {
    constructor(slug: string) {
        super(`Link with slug ${slug} not found`, 404);
    }
}

export class LinkConflictException extends HttpException {
    constructor(slug: string) {
        super(`Link with slug ${slug} already exists`, 409);
    }
}

export class LinkExpiresInThePastException extends HttpException {
    constructor() {
        super(`Expiration date cannot be in the past`, 400);
    }
}

export class UnauthorizedLinkAccessException extends HttpException {
    constructor() {
        super(`Unauthorized access, you do not have permission to access this resource`, 403);
    }
}
