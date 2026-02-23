import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { LinkRepository } from './link.repository.interface';
import { CreateLinkDto, Link, UpdateLinkDto } from './link.dto';
import { AuthGuard } from 'src/user/auth/auth.guard';
import { CurrentUser } from 'src/user/auth/currentUser.decorator';
import { UserContextDto } from 'src/user/user.dto';
import { SlugService } from './slug/slug.service';
import { LinkExpiresInThePastException, UnauthorizedLinkAccessException } from './link.exception';

@UseGuards(AuthGuard)
@Controller('link')
export class LinkController {
    constructor(
        private readonly linkRepository: LinkRepository,
        private readonly slugService: SlugService,
    ) {}

    @Get(':slug')
    async getLink(@Param('slug') slug: string, @CurrentUser() user: UserContextDto): Promise<Link> {
        const link = await this.linkRepository.findBySlug(slug);
        if (link.userId !== user.id) {
            throw new UnauthorizedLinkAccessException();
        }
        return link;
    }

    @Post()
    async createLink(
        @Body() createLinkDto: CreateLinkDto,
        @CurrentUser() user: UserContextDto,
    ): Promise<{ slug: string }> {
        const slug = await this.slugService.generateUniqueSlug();

        if (createLinkDto.expireAt && createLinkDto.expireAt < new Date()) {
            throw new LinkExpiresInThePastException();
        }

        await this.linkRepository.create({
            userId: user.id,
            slug: slug,
            targetUrl: createLinkDto.targetUrl,
            expireAt: createLinkDto.expireAt,
        });
        return { slug };
    }

    @Put(':slug')
    async updateLink(
        @Param('slug') slug: string,
        @Body() updateLinkDto: UpdateLinkDto,
        @CurrentUser() user: UserContextDto,
    ): Promise<void> {
        const existingLink = await this.linkRepository.findBySlug(slug);
        if (existingLink.userId !== user.id) {
            throw new UnauthorizedLinkAccessException();
        }

        if (updateLinkDto.expireAt && updateLinkDto.expireAt < new Date()) {
            throw new LinkExpiresInThePastException();
        }

        await this.linkRepository.update({
            ...existingLink,
            ...updateLinkDto,
        });
    }
}
