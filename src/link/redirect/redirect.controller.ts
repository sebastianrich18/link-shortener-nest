import { Controller, Get, Param, Res } from '@nestjs/common';
import { type Response } from 'express';
import { LinkRepository } from '../link.repository.interface';

@Controller()
export class RedirectController {
    constructor(private readonly linkRepository: LinkRepository) {}

    @Get(':slug')
    async redirect(@Param('slug') slug: string, @Res() res: Response): Promise<void> {
        const link = await this.linkRepository.findBySlug(slug);

        if (link.expireAt && link.expireAt < new Date()) {
            res.status(410).send('Link has expired');
            return;
        }

        res.redirect(link.targetUrl);
    }
}
