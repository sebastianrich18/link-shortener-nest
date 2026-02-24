import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { RedirectResponse } from '../redirect/redirect.dto';
import { CacheService } from './cache.service.interface';
import { CacheMissException } from './cache.exception';
import { HttpAdapterHost } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheAsideLinkInterceptor implements NestInterceptor<RedirectResponse, RedirectResponse> {
    private static readonly KEY_EXPIRATION_SECONDS = 60 * 60; // 1 hour

    constructor(
        private readonly cache: CacheService,
        private readonly httpAdapterHost: HttpAdapterHost,
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler<RedirectResponse>,
    ): Promise<Observable<RedirectResponse>> {
        const http = context.switchToHttp();
        const request = http.getRequest<Record<string, unknown>>();
        const response = http.getResponse<Record<string, unknown>>();
        const adapter = this.httpAdapterHost.httpAdapter;

        const params = request['params'] as Record<string, string> | undefined;
        const slug = params?.['slug'];

        // need to check for existance of slug since this interceptor runs before the zod validation pipe
        // if slug is missing, send it down the chain and let the validation pipe handle it
        if (!slug) {
            return next.handle();
        }

        let cached: RedirectResponse;
        try {
            cached = await this.cache.get<RedirectResponse>(`link:${slug}`);
        } catch (err) {
            if (err instanceof CacheMissException) {
                adapter.setHeader(response, 'X-Cache', 'MISS');
                return next.handle().pipe(
                    tap((data: RedirectResponse) => {
                        // void so we dont wait for promise to resolve, just repond and let it complete in the background
                        void this.cache.set(`link:${slug}`, data, this.getTtlSeconds(data.expireAt));
                    }),
                );
            } else {
                throw err;
            }
        }

        adapter.setHeader(response, 'X-Cache', 'HIT');
        return of(cached);
    }

    getTtlSeconds(expireAt: string | null): number {
        if (!expireAt) {
            return CacheAsideLinkInterceptor.KEY_EXPIRATION_SECONDS;
        }
        const expireAtTime = new Date(expireAt).getTime();
        const now = Date.now();
        return Math.min((expireAtTime - now) / 1000, CacheAsideLinkInterceptor.KEY_EXPIRATION_SECONDS);
    }
}
