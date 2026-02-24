import { LinkExpiresInThePastException, UnauthorizedLinkAccessException } from './link.exception';
import { Body, Controller, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CreateLinkDto, Link, LinkCreated, UpdateLinkDto } from './link.dto';
import { CurrentUser } from 'src/user/auth/currentUser.decorator';
import { LinkRepository } from './link.repository.interface';
import { AuthGuard } from 'src/user/auth/auth.guard';
import { UserContextDto } from 'src/user/user.dto';
import { SlugService } from './slug/slug.service';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Links')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('link')
export class LinkController {
    constructor(
        private readonly linkRepository: LinkRepository,
        private readonly slugService: SlugService,
    ) {}

    @Get(':slug')
    @ApiOperation({ summary: 'Get link details by slug' })
    @ApiOkResponse({ description: 'Link details', type: Link })
    @ApiNotFoundResponse({ description: 'Link not found' })
    @ApiForbiddenResponse({ description: 'You do not own this link' })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
    async getLink(@Param('slug') slug: string, @CurrentUser() user: UserContextDto): Promise<Link> {
        const link = await this.linkRepository.findBySlug(slug);
        if (link.userId !== user.id) {
            throw new UnauthorizedLinkAccessException();
        }
        return link;
    }

    @Post()
    @ApiOperation({ summary: 'Create a shortened link' })
    @ApiCreatedResponse({ description: 'Link created, returns generated slug', type: LinkCreated })
    @ApiBadRequestResponse({ description: 'Invalid URL or expiration date in the past' })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
    async createLink(@Body() createLinkDto: CreateLinkDto, @CurrentUser() user: UserContextDto): Promise<LinkCreated> {
        const slug = await this.slugService.generateUniqueSlug();

        if (createLinkDto.expireAt && new Date(createLinkDto.expireAt) < new Date()) {
            throw new LinkExpiresInThePastException();
        }

        await this.linkRepository.create({
            userId: user.id,
            slug: slug,
            targetUrl: createLinkDto.targetUrl,
            expireAt: createLinkDto.expireAt,
        });
        return { slug, targetUrl: createLinkDto.targetUrl, expireAt: createLinkDto.expireAt } as LinkCreated;
    }

    @Put(':slug')
    @HttpCode(204)
    @ApiOperation({ summary: 'Update an existing link' })
    @ApiNoContentResponse({ description: 'Link updated successfully' })
    @ApiNotFoundResponse({ description: 'Link not found' })
    @ApiForbiddenResponse({ description: 'You do not own this link' })
    @ApiBadRequestResponse({ description: 'Invalid URL, expiration date in the past, or extra fields' })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
    async updateLink(
        @Param('slug') slug: string,
        @Body() updateLinkDto: UpdateLinkDto,
        @CurrentUser() user: UserContextDto,
    ): Promise<void> {
        const existingLink = await this.linkRepository.findBySlug(slug);
        if (existingLink.userId !== user.id) {
            throw new UnauthorizedLinkAccessException();
        }

        if (updateLinkDto.expireAt && new Date(updateLinkDto.expireAt) < new Date()) {
            throw new LinkExpiresInThePastException();
        }

        await this.linkRepository.update({
            ...existingLink,
            ...updateLinkDto,
        });
    }
}
