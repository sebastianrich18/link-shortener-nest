import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Dont import prisma models here to avoid coupling the domain to db infra conserns.
// We can add tests and/or linting rules to enforce that the DTO alligns with the DB model.

export enum Role {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export const CreateUserSchema = z.object({
    role: z.enum(Role),
    email: z.email(),
    passwordHash: z.string(),
});
export class CreateUser extends createZodDto(CreateUserSchema) {}

export const UserSchema = z.object({
    id: z.int(),
    role: z.enum(Role),
    email: z.email(),
    passwordHash: z.string(),
});
export class User extends createZodDto(UserSchema) {}

// Request DTO for creating users endpoint
export const PostUserDtoSchema = z.object({
    email: z.email(),
    passwordClearText: z.string().min(8), // enforce a minimum password length
});
export class PostUserDto extends createZodDto(PostUserDtoSchema) {}

// Used for the user context in authenticated requests. Should only contain non-sensitive information.
export const UserContextSchema = z.object({
    id: z.int(),
    email: z.email(),
    role: z.enum(Role),
});
export class UserContextDto extends createZodDto(UserContextSchema) {}
