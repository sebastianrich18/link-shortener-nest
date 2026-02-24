import { RedirectController } from './redirect/redirect.controller';
import { LinkRepository } from './link.repository.interface';
import { PrismaLinkRepository } from './link.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LinkController } from './link.controller';
import { SlugService } from './slug/slug.service';
import { UserModule } from 'src/user/user.module';
import { Module } from '@nestjs/common';

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
