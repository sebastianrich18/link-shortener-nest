import { defineConfig } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: 'postgresql://admin:admin@localhost:5432/linkshortener?schema=public',
    },
});
