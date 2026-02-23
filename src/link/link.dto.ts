import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateLinkSchema = z.object({
    targetUrl: z.url(),
    slug: z
        .string()
        .length(12)
        .regex(/^[a-z0-9]+$/), // only lowercase letters and numbers
    userId: z.int(),
    expireAt: z.iso.datetime().optional(),
});
export class CreateLink extends createZodDto(CreateLinkSchema) {}

export const LinkSchema = z.object({
    id: z.int(),
    targetUrl: z.url(),
    slug: z
        .string()
        .length(12)
        .regex(/^[a-z0-9]+$/),
    createdAt: z.iso.datetime(),
    userId: z.int(),
    expireAt: z.iso.datetime().optional(),
});
export class Link extends createZodDto(LinkSchema) {}

export const LinkCreatedSchema = z.object({
    slug: z.string(),
});
export class LinkCreated extends createZodDto(LinkCreatedSchema) {}

export const CreateLinkDtoSchema = z.object({
    targetUrl: z.url(),
    expireAt: z.iso.datetime().optional(),
});
export class CreateLinkDto extends createZodDto(CreateLinkDtoSchema) {}

export const UpdateLinkDtoSchema = z
    .object({
        targetUrl: z.url().optional(),
        expireAt: z.iso.datetime().optional(),
    })
    .strict(); // strict will throw errors for extra fields (prevents changing the slug or userId through the update endpoint)
export class UpdateLinkDto extends createZodDto(UpdateLinkDtoSchema) {}
