import { FailedToGenerateUniqueSlugException } from './slug.exception';
import { LinkRepository } from '../link.repository.interface';
import { LinkNotFoundException } from '../link.exception';
import { Injectable } from '@nestjs/common';
@Injectable()
export class SlugService {
    private readonly maxTries = 5;
    private readonly slugLength = 12;
    private readonly characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    constructor(private readonly linkRepository: LinkRepository) {}

    async generateUniqueSlug(): Promise<string> {
        for (let i = 0; i < this.maxTries; i++) {
            const slug = this.generateSlug();
            if (await this.isSlugUnique(slug)) {
                return slug;
            }
        }
        throw new FailedToGenerateUniqueSlugException();
    }

    private generateSlug(): string {
        return Array.from(
            { length: this.slugLength },
            () =>
                this.characters[
                    Math.floor(
                        (crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)) * this.characters.length,
                    )
                ],
        ).join('');
    }

    private async isSlugUnique(slug: string): Promise<boolean> {
        try {
            await this.linkRepository.findBySlug(slug);
            return false;
        } catch (e) {
            if (e instanceof LinkNotFoundException) {
                return true;
            }
            throw e;
        }
    }
}
