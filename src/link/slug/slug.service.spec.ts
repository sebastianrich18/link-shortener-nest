import { Test, TestingModule } from '@nestjs/testing';
import { LinkRepository } from '../link.repository.interface';
import { InMemoryLinkRepository } from '../link.repository';
import { SlugService } from './slug.service';
import { FailedToGenerateUniqueSlugException } from './slug.exception';

describe('SlugService', () => {
    let service: SlugService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SlugService, { provide: LinkRepository, useClass: InMemoryLinkRepository }],
        }).compile();

        service = module.get<SlugService>(SlugService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should have a length of 12', async () => {
        const slug = await service.generateUniqueSlug();
        expect(slug).toHaveLength(12);
    });

    it('should only contain lowercase letters and digits', async () => {
        const slug = await service.generateUniqueSlug();
        expect(slug).toMatch(/^[a-z0-9]+$/);
    });

    it('should generate unique slugs', async () => {
        const slugs = new Set<string>();
        for (let i = 0; i < 10000; i++) {
            const slug = await service.generateUniqueSlug();
            expect(slugs.has(slug)).toBeFalsy();
            slugs.add(slug);
        }
    });

    // mock generateSlug to return a fixed value to test the retry logic
    it('should retry if a slug already exists', async () => {
        const linkRepository = new InMemoryLinkRepository();
        const slugService = new SlugService(linkRepository);

        // mock generateSlug to return a fixed value
        jest.spyOn(slugService as any, 'generateSlug').mockReturnValue('fixedslug');

        // create a link with the fixed slug to cause a conflict
        await linkRepository.create({
            id: 1,
            userId: 1,
            slug: 'fixedslug',
            targetUrl: 'https://example.com',
        });

        await expect(slugService.generateUniqueSlug()).rejects.toThrow(FailedToGenerateUniqueSlugException);
    });
});
