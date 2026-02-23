import { Injectable } from '@nestjs/common';
import { Link } from './link.dto';
import { LinkRepository } from './linkRepository.interface';
import { LinkConflictException, LinkNotFoundException } from './link.exception';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PrismaLinkRepository implements LinkRepository {
    // https://docs.prisma.io/docs/orm/reference/error-reference
    readonly UNIQUE_CONSTRAINT_VIOLATION_CODE = 'P2002';
    readonly RECORD_NOT_FOUND_CODE = 'P2025';

    constructor(private readonly prisma: PrismaService) {}

    async findBySlug(slug: string): Promise<Link> {
        const link = (await this.prisma.link.findUnique({
            where: { slug },
        })) as Link;
        if (!link) {
            throw new LinkNotFoundException(slug);
        }
        return link;
    }

    async create(link: Link): Promise<void> {
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

export class InMemoryLinkRepository implements LinkRepository {
    private links: Link[] = [];

    async findBySlug(slug: string): Promise<Link> {
        return new Promise((resolve, reject) => {
            const link = this.links.find((link) => link.slug === slug);
            if (!link) {
                reject(new LinkNotFoundException(slug));
            }
            resolve(link as Link);
        });
    }

    async create(link: Link): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.links.some((l) => l.slug === link.slug)) {
                reject(new LinkConflictException(link.slug));
            }
            this.links.push({ ...link, id: this.links.length + 1 } as Link);
            resolve();
        });
    }

    async update(link: Link): Promise<void> {
        return new Promise((resolve, reject) => {
            const index = this.links.findIndex((l) => l.id === link.id);
            if (index === -1) {
                reject(new LinkNotFoundException(link.slug));
            }
            if (this.links.some((l) => l.slug === link.slug && l.id !== link.id)) {
                reject(new LinkConflictException(link.slug));
            }
            this.links[index] = { ...link };
            resolve();
        });
    }
}
