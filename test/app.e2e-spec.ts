process.env.DATABASE_URL = 'fake-url-for-testing';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

import { UserRepository } from 'src/user/user.repository.interface';
import { LinkRepository } from 'src/link/link.repository.interface';
import { InMemoryUserRepository } from 'src/user/user.repository';
import { InMemoryLinkRepository } from 'src/link/link.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateLink, Link } from 'src/link/link.dto';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { User } from 'src/user/user.dto';
import { App } from 'supertest/types';
import request from 'supertest';

describe('App (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(UserRepository)
            .useClass(InMemoryUserRepository)
            .overrideProvider(LinkRepository)
            .useClass(InMemoryLinkRepository)
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    describe('/health (GET)', () => {
        it('returns ok status', async () => {
            await request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
        });
    });

    describe('/register (POST)', () => {
        it('creates a user and returns a token', async () => {
            await request(app.getHttpServer())
                .post('/register')
                .send({ passwordClearText: 'password123', email: 'john.doe@example.com' })
                .expect(201);
        });

        it('rejects invalid email', async () => {
            await request(app.getHttpServer())
                .post('/register')
                .send({ passwordClearText: 'password123', email: 'invalid-email' })
                .expect(400);
        });

        it('rejects short password', async () => {
            await request(app.getHttpServer())
                .post('/register')
                .send({ passwordClearText: 'short', email: 'john.doe@example.com' })
                .expect(400);
        });

        it('rejects missing email', async () => {
            await request(app.getHttpServer()).post('/register').send({ passwordClearText: 'password123' }).expect(400);
        });

        it('rejects missing password', async () => {
            await request(app.getHttpServer()).post('/register').send({ email: 'john.doe@example.com' }).expect(400);
        });

        it('rejects empty body', async () => {
            await request(app.getHttpServer()).post('/register').send({}).expect(400);
        });
    });

    describe('/login (POST)', () => {
        beforeEach(async () => {
            await request(app.getHttpServer())
                .post('/register')
                .send({ passwordClearText: 'password123', email: 'john.doe@example.com' });
        });

        it('returns a token for valid credentials', async () => {
            await request(app.getHttpServer())
                .post('/login')
                .send({ passwordClearText: 'password123', email: 'john.doe@example.com' })
                .expect(200)
                .expect((res) => {
                    expect((res.body as { token: string }).token).toBeDefined();
                });
        });

        it('rejects wrong password', async () => {
            await request(app.getHttpServer())
                .post('/login')
                .send({ passwordClearText: 'wrongpassword', email: 'john.doe@example.com' })
                .expect(401);
        });

        it('rejects non-existent user', async () => {
            await request(app.getHttpServer())
                .post('/login')
                .send({ passwordClearText: 'password123', email: 'nonexistent@example.com' })
                .expect(401);
        });

        it('does not save passwords in plain text', async () => {
            const userRepository = app.get(UserRepository);
            const user: User = await userRepository.findByEmail('john.doe@example.com');
            expect(user.passwordHash).not.toBe('password123');
        });
    });

    describe('authenticated routes', () => {
        let token: string;

        beforeEach(async () => {
            const res = await request(app.getHttpServer())
                .post('/register')
                .send({ passwordClearText: 'password123', email: 'john.doe@example.com' })
                .expect(201);
            token = (res.body as { token: string }).token;
        });

        describe('/link (POST)', () => {
            it('creates a link', async () => {
                await request(app.getHttpServer())
                    .post('/link')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://example.com' })
                    .expect(201)
                    .expect((res) => {
                        expect((res.body as { slug: string }).slug).toBeDefined();
                    });
            });

            it('creates a link with expiration date', async () => {
                await request(app.getHttpServer())
                    .post('/link')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://example.com', expireAt: new Date(Date.now() + 3600 * 1000) })
                    .expect(201)
                    .expect((res) => {
                        expect((res.body as { slug: string }).slug).toBeDefined();
                    });
            });

            it('rejects expiration date in the past', async () => {
                await request(app.getHttpServer())
                    .post('/link')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://example.com', expireAt: new Date(Date.now() - 3600 * 1000) })
                    .expect(400);
            });

            it('rejects invalid url', async () => {
                await request(app.getHttpServer())
                    .post('/link')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'not-a-valid-url' })
                    .expect(400);
            });

            it('rejects missing auth', async () => {
                await request(app.getHttpServer()).post('/link').send({ targetUrl: 'https://example.com' }).expect(401);
            });

            it('rejects invalid token', async () => {
                await request(app.getHttpServer())
                    .post('/link')
                    .set('Authorization', `Bearer invalidtoken`)
                    .send({ targetUrl: 'https://example.com' })
                    .expect(401);
            });
        });

        describe('/link/:slug (PUT)', () => {
            it('returns 404 for non-existent slug', async () => {
                await request(app.getHttpServer())
                    .get('/link/nonexistentslug')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(404);
            });

            it('rejects changing slug', async () => {
                const res = await request(app.getHttpServer())
                    .post('/link')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://example.com' })
                    .expect(201);
                const slug = (res.body as { slug: string }).slug;

                await request(app.getHttpServer())
                    .put(`/link/${slug}`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://example.com', slug: 'newslug123' })
                    .expect(400);
            });

            it('rejects expiration date in the past', async () => {
                const res = await request(app.getHttpServer())
                    .post('/link')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://example.com' })
                    .expect(201);
                const slug = (res.body as { slug: string }).slug;

                await request(app.getHttpServer())
                    .put(`/link/${slug}`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://example.com', expireAt: new Date(Date.now() - 3600 * 1000) })
                    .expect(400);
            });

            it('rejects access from a different user', async () => {
                const res = await request(app.getHttpServer())
                    .post('/link')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://example.com' })
                    .expect(201);
                const slug = (res.body as { slug: string }).slug;

                const register2Response = await request(app.getHttpServer())
                    .post('/register')
                    .send({ passwordClearText: 'password123', email: 'jane.doe@example.com' })
                    .expect(201);
                const token2 = (register2Response.body as { token: string }).token;

                await request(app.getHttpServer())
                    .get(`/link/${slug}`)
                    .set('Authorization', `Bearer ${token2}`)
                    .expect(403);
            });

            it('allows users to update their own links', async () => {
                const res = await request(app.getHttpServer())
                    .post('/link')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://example.com' })
                    .expect(201);
                const slug = (res.body as { slug: string }).slug;

                await request(app.getHttpServer())
                    .put(`/link/${slug}`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://updated-example.com' })
                    .expect(204);

                await request(app.getHttpServer())
                    .get(`/link/${slug}`)
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200)
                    .expect((res) => {
                        expect((res.body as Link).targetUrl).toBe('https://updated-example.com');
                    });

                await request(app.getHttpServer())
                    .get(`/${slug}`)
                    .expect(302)
                    .expect('Location', 'https://updated-example.com');
            });
        });

        describe('/link/:slug (GET)', () => {
            let slug: string;

            beforeEach(async () => {
                const res = await request(app.getHttpServer())
                    .post('/link')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://example.com' })
                    .expect(201);
                slug = (res.body as { slug: string }).slug;
            });

            it('returns link details', async () => {
                await request(app.getHttpServer())
                    .get(`/link/${slug}`)
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200)
                    .expect((res) => {
                        expect((res.body as Link).slug).toBe(slug);
                        expect((res.body as Link).targetUrl).toBe('https://example.com');
                    });
            });

            it('returns 404 for non-existent slug', async () => {
                await request(app.getHttpServer())
                    .get('/link/nonexistentslug')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(404);
            });

            it('rejects access from a different user', async () => {
                const register2Response = await request(app.getHttpServer())
                    .post('/register')
                    .send({ passwordClearText: 'password123', email: 'jane.doe@example.com' })
                    .expect(201);
                const token2 = (register2Response.body as { token: string }).token;

                await request(app.getHttpServer())
                    .get(`/link/${slug}`)
                    .set('Authorization', `Bearer ${token2}`)
                    .expect(403);
            });
        });

        describe('/:slug redirect (GET)', () => {
            it('redirects to target url', async () => {
                const res = await request(app.getHttpServer())
                    .post('/link')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ targetUrl: 'https://example.com' })
                    .expect(201);
                const slug = (res.body as { slug: string }).slug;

                await request(app.getHttpServer())
                    .get(`/${slug}`)
                    .expect(302)
                    .expect('Location', 'https://example.com');
            });

            it('returns 404 for non-existent slug', async () => {
                await request(app.getHttpServer()).get('/nonexistentslug').expect(404);
            });

            it('returns 410 for expired link', async () => {
                // Use the repo directly to skip expired in the past check from the controller
                const linkRepository = app.get(LinkRepository);
                await linkRepository.create({
                    targetUrl: 'https://example.com',
                    slug: 'expiredslug12',
                    userId: 1,
                    expireAt: new Date(Date.now() - 1000).toISOString(),
                } as CreateLink);

                await request(app.getHttpServer()).get('/expiredslug12').expect(410);
            });
        });
    });
});
