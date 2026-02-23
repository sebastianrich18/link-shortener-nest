import { Injectable } from '@nestjs/common';
import { CreateLink, Link } from './link.dto';
import { LinkRepository } from './link.repository.interface';
import { LinkConflictException, LinkNotFoundException } from './link.exception';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PrismaLinkRepository extends LinkRepository {
    // https://docs.prisma.io/docs/orm/reference/error-reference
    readonly UNIQUE_CONSTRAINT_VIOLATION_CODE = 'P2002';
    readonly RECORD_NOT_FOUND_CODE = 'P2025';

    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findBySlug(slug: string): Promise<Link> {
        const row = await this.prisma.link.findUnique({
            where: { slug },
        });
        if (!row) {
            throw new LinkNotFoundException(slug);
        }
        return {
            id: row.id,
            targetUrl: row.targetUrl,
            slug: row.slug,
            createdAt: row.createdAt,
            userId: row.userId,
            expireAt: row.expireAt ?? undefined,
        };
    }

    async create(link: CreateLink): Promise<void> {
        try {
            await this.prisma.link.create({ data: link });
        } catch (e: unknown) {
            if (e instanceof Error && 'code' in e && e.code === this.UNIQUE_CONSTRAINT_VIOLATION_CODE) {
                throw new LinkConflictException(link.slug);
            }
            throw e;
        }
    }

    async update(link: Link): Promise<void> {
        try {
            await this.prisma.link.update({
                where: { id: link.id },
                data: link,
            });
        } catch (e: unknown) {
            if (e instanceof Error && 'code' in e && e.code === this.RECORD_NOT_FOUND_CODE) {
                throw new LinkNotFoundException(link.slug);
            }
            if (e instanceof Error && 'code' in e && e.code === this.UNIQUE_CONSTRAINT_VIOLATION_CODE) {
                throw new LinkConflictException(link.slug);
            }
            throw e;
        }
    }
}

export class InMemoryLinkRepository extends LinkRepository {
    private links: Link[] = [];

    async findBySlug(slug: string): Promise<Link> {
        return new Promise((resolve) => {
            const link = this.links.find((link) => link.slug === slug);
            if (!link) {
                throw new LinkNotFoundException(slug);
            }
            resolve(link);
        });
    }

    async create(link: CreateLink): Promise<void> {
        return new Promise((resolve) => {
            if (this.links.some((l) => l.slug === link.slug)) {
                throw new LinkConflictException(link.slug);
            }
            this.links.push({
                ...link,
                id: this.links.length + 1,
                createdAt: new Date(),
            });
            resolve();
        });
    }

    async update(link: Link): Promise<void> {
        return new Promise((resolve) => {
            const index = this.links.findIndex((l) => l.id === link.id);
            if (index === -1) {
                throw new LinkNotFoundException(link.slug);
            }
            if (this.links.some((l) => l.slug === link.slug && l.id !== link.id)) {
                throw new LinkConflictException(link.slug);
            }
            this.links[index] = { ...link };
            resolve();
        });
    }
}
