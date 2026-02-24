import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service.interface';

interface RedirectResponse {
    url: string;
    statusCode: number;
}

@Injectable()
export class CacheAsideLinkInterceptor implements NestInterceptor<RedirectResponse, RedirectResponse> {
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

        if (!slug) {
            return next.handle();
        }

        const cached = await this.cache.get<RedirectResponse>(`link:${slug}`);
        if (cached) {
            adapter.setHeader(response, 'X-Cache', 'HIT');
            return of(cached);
        }
        adapter.setHeader(response, 'X-Cache', 'MISS');

        return next.handle().pipe(
            tap((data) => {
                void this.cache.set(`link:${slug}`, data, 60 * 60);
            }),
        );
    }
}
