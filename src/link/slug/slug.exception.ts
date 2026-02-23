export class FailedToGenerateUniqueSlugException extends Error {
    constructor() {
        super('Failed to generate a unique slug after 5 attempts');
    }
}
