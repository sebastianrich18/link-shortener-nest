export class CacheMissException extends Error {
    constructor(key: string) {
        super(`Cache miss for key: ${key}`);
        this.name = 'CacheMissException';
    }
}
