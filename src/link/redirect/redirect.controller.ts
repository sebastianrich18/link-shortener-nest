import { Controller, Get, Param, Redirect } from '@nestjs/common';
import { LinkRepository } from '../link.repository.interface';
import { ApiFoundResponse, ApiGoneResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { LinkIsExpiredException } from '../link.exception';

@Controller()
export class RedirectController {
    constructor(private readonly linkRepository: LinkRepository) {}

    @ApiFoundResponse({ description: 'Redirects to the target URL' })
    @ApiGoneResponse({ description: 'Link has expired' })
    @ApiNotFoundResponse({ description: 'Link not found' })
    @Get(':slug')
    @Redirect()
    async redirect(@Param('slug') slug: string): Promise<{ url: string; statusCode: number }> {
        const link = await this.linkRepository.findBySlug(slug);

        if (link.expireAt && new Date(link.expireAt) < new Date()) {
            throw new LinkIsExpiredException();
        }

        return { url: link.targetUrl, statusCode: 302 };
    }
}
