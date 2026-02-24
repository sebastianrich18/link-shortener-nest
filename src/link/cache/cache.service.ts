import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CacheService } from './cache.service.interface';
import { CacheMissException } from './cache.exception';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService extends CacheService implements OnModuleDestroy, OnModuleInit {
    private readonly client: Redis;

    constructor(private readonly configService: ConfigService) {
        super();
        this.client = new Redis(this.configService.getOrThrow<string>('REDIS_URL'));
    }

    async get<T>(key: string): Promise<T> {
        const value = await this.client.get(key);
        if (value === null) {
            throw new CacheMissException(key);
        }
        return JSON.parse(value) as T;
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
            await this.client.set(key, serialized, 'EX', ttlSeconds);
        } else {
            await this.client.set(key, serialized);
        }
    }

    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }

    async onModuleDestroy(): Promise<void> {
        await this.client.quit();
    }

    // This is not strictly required, but it allows us to verify connectivity at startup
    // Without it, it would just fail on first request
    async onModuleInit(): Promise<void> {
        await this.client.ping();
    }
}

@Injectable()
export class InMemoryCacheService extends CacheService {
    private readonly store = new Map<string, { value: any; expiresAt: number | null }>();

    async get<T>(key: string): Promise<T> {
        const entry = this.store.get(key);
        if (!entry) throw new CacheMissException(key);
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.store.delete(key);
            throw new CacheMissException(key);
        }
        return Promise.resolve(entry.value as T);
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
        this.store.set(key, { value, expiresAt });
        return Promise.resolve();
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
        return Promise.resolve();
    }
}
