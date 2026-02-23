import { Module } from '@nestjs/common';
import { RedirectController } from './redirect/redirect.controller';
import { PrismaLinkRepository } from './link.repository';
import { LinkController } from './link.controller';
import { UserModule } from 'src/user/user.module';
import { LinkRepository } from './linkRepository.interface';
import { SlugService } from './slug/slug.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [UserModule, PrismaModule],
    controllers: [LinkController, RedirectController],
    providers: [
        {
            provide: LinkRepository,
            useClass: PrismaLinkRepository,
        },
        SlugService,
    ],
})
export class LinkModule {}
