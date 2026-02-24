import { RedirectController } from './redirect/redirect.controller';
import { LinkRepository } from './link.repository.interface';
import { PrismaLinkRepository } from './link.repository';
import { RedisCacheService } from './cache/cache.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LinkController } from './link.controller';
import { CacheService } from './cache/cache.service.interface';
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
        {
            provide: CacheService,
            useClass: RedisCacheService,
        },
        SlugService,
    ],
})
export class LinkModule {}
