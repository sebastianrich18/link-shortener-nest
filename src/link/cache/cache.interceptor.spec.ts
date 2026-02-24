import { CacheAsideLinkInterceptor } from './cache.interceptor';
import { InMemoryCacheService } from './cache.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';
import { RedirectResponse } from '../redirect/redirect.dto';

function createMockContext(slug?: string) {
    const request = { params: { slug } };
    const response = {};
    const context = {
        switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => response,
        }),
    } as unknown as ExecutionContext;
    return { context, response };
}

function createMockAdapterHost() {
    const headers: Record<string, string> = {};
    const httpAdapterHost = {
        httpAdapter: {
            setHeader: (_res: unknown, key: string, value: string) => (headers[key] = value),
        },
    } as unknown as HttpAdapterHost;
    return { httpAdapterHost, headers };
}

function createMockHandler(response: RedirectResponse): CallHandler<RedirectResponse> {
    return { handle: () => of(response) };
}

describe('CacheAsideLinkInterceptor', () => {
    let interceptor: CacheAsideLinkInterceptor;
    let cache: InMemoryCacheService;
    let headers: Record<string, string>;

    beforeEach(() => {
        cache = new InMemoryCacheService();
        const mock = createMockAdapterHost();
        headers = mock.headers;
        interceptor = new CacheAsideLinkInterceptor(cache, mock.httpAdapterHost);
    });

    it('passes through when no slug param exists', async () => {
        const { context } = createMockContext(undefined);
        const handler = createMockHandler({ url: 'https://example.com', statusCode: 302, expireAt: null });
        const result$ = await interceptor.intercept(context, handler);
        const value = await lastValueFrom(result$);
        expect(value).toEqual({ url: 'https://example.com', statusCode: 302, expireAt: null });
    });

    it('returns cached value and sets X-Cache HIT header', async () => {
        await cache.set('link:abc123', { url: 'https://cached.com', statusCode: 302, expireAt: null });

        const { context } = createMockContext('abc123');
        const handler = { handle: jest.fn() } as unknown as CallHandler<RedirectResponse>;
        const result$ = await interceptor.intercept(context, handler);
        const value = await lastValueFrom(result$);

        expect(value).toEqual({ url: 'https://cached.com', statusCode: 302, expireAt: null });
        expect(headers['X-Cache']).toBe('HIT');
        expect((handler as unknown as { handle: jest.Mock }).handle).not.toHaveBeenCalled();
    });

    it('calls handler, caches result, and sets X-Cache MISS header', async () => {
        const response = { url: 'https://example.com', statusCode: 302, expireAt: null };
        const { context } = createMockContext('newslug');
        const handler = createMockHandler(response);

        const result$ = await interceptor.intercept(context, handler);
        const value = await lastValueFrom(result$);

        expect(value).toEqual(response);
        expect(headers['X-Cache']).toBe('MISS');

        // Allow the tap side-effect to complete
        await new Promise((r) => setTimeout(r, 10));
        expect(await cache.get('link:newslug')).toEqual(response);
    });

    it('does not return stale cache after deletion', async () => {
        await cache.set('link:slug1', { url: 'https://old.com', statusCode: 302, expireAt: null });
        await cache.delete('link:slug1');

        const response = { url: 'https://new.com', statusCode: 302, expireAt: null };
        const { context } = createMockContext('slug1');
        const handler = createMockHandler(response);

        const result$ = await interceptor.intercept(context, handler);
        const value = await lastValueFrom(result$);

        expect(value).toEqual(response);
        expect(headers['X-Cache']).toBe('MISS');
    });
});
