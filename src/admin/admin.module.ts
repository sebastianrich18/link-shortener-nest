import type { DynamicModule } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

export function createAdminModule(): Promise<DynamicModule> {
    return import('@adminjs/nestjs').then(({ AdminModule }) =>
        AdminModule.createAdminAsync({
            imports: [PrismaModule],
            inject: [PrismaService],
            useFactory: async (prisma: PrismaService) => {
                const AdminJS = (await import('adminjs')).default;
                const { Database, Resource } = await import('@adminjs/prisma');
                const { dmmfModels, clientModule } = await import('./prisma-dmmf-compat.js');

                AdminJS.registerAdapter({ Database, Resource });

                return {
                    adminJsOptions: {
                        rootPath: '/admin',
                        resources: [
                            {
                                resource: {
                                    model: dmmfModels.User,
                                    client: prisma,
                                    clientModule,
                                },
                                options: {
                                    properties: {
                                        passwordHash: { isVisible: false },
                                        email: { isTitle: true },
                                    },
                                },
                            },
                            {
                                resource: {
                                    model: dmmfModels.Link,
                                    client: prisma,
                                    clientModule,
                                },
                                options: {
                                    properties: {
                                        slug: { isTitle: true },
                                    },
                                },
                            },
                            {
                                resource: {
                                    model: dmmfModels.ClickEvent,
                                    client: prisma,
                                    clientModule,
                                },
                                options: {
                                    actions: {
                                        new: { isAccessible: false },
                                        edit: { isAccessible: false },
                                        delete: { isAccessible: false },
                                    },
                                },
                            },
                        ],
                    },
                };
            },
        }),
    );
}
