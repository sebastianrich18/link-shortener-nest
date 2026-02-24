import { CacheMissException } from './cache.exception';
import { InMemoryCacheService } from './cache.service';

describe('InMemoryCacheService', () => {
    let cache: InMemoryCacheService;

    beforeEach(() => {
        cache = new InMemoryCacheService();
    });

    it('throws CacheMissException for a missing key', async () => {
        await expect(cache.get('missing')).rejects.toThrow(CacheMissException);
    });

    it('stores and retrieves a value', async () => {
        await cache.set('key', { url: 'https://example.com' });
        expect(await cache.get('key')).toEqual({ url: 'https://example.com' });
    });

    it('deletes a value', async () => {
        await cache.set('key', 'value');
        await cache.delete('key');
        await expect(cache.get('key')).rejects.toThrow(CacheMissException);
    });

    it('returns null for an expired entry', async () => {
        jest.useFakeTimers();
        await cache.set('key', 'value', 10);
        expect(await cache.get('key')).toBe('value');

        jest.advanceTimersByTime(11_000);
        await expect(cache.get('key')).rejects.toThrow(CacheMissException);
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
