import { InMemoryCacheService } from './cache.service';

describe('InMemoryCacheService', () => {
    let cache: InMemoryCacheService;

    beforeEach(() => {
        cache = new InMemoryCacheService();
    });

    it('returns null for a missing key', async () => {
        expect(await cache.get('missing')).toBeNull();
    });

    it('stores and retrieves a value', async () => {
        await cache.set('key', { url: 'https://example.com' });
        expect(await cache.get('key')).toEqual({ url: 'https://example.com' });
    });

    it('deletes a value', async () => {
        await cache.set('key', 'value');
        await cache.delete('key');
        expect(await cache.get('key')).toBeNull();
    });

    it('returns null for an expired entry', async () => {
        jest.useFakeTimers();
        await cache.set('key', 'value', 10);
        expect(await cache.get('key')).toBe('value');

        jest.advanceTimersByTime(11_000);
        expect(await cache.get('key')).toBeNull();
        jest.useRealTimers();
    });

    it('returns value before TTL expires', async () => {
        jest.useFakeTimers();
        await cache.set('key', 'value', 10);

        jest.advanceTimersByTime(9_000);
        expect(await cache.get('key')).toBe('value');
        jest.useRealTimers();
    });
});
