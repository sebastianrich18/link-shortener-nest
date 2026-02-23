import { UserConflictException, UserNotFoundByEmailException, UserNotFoundByIdException } from './user.exception';
import { UserRepository } from './user.repository.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateUser, Role, User } from './user.dto';

@Injectable()
export class PrismaUserRepository extends UserRepository {
    // https://docs.prisma.io/docs/orm/reference/error-reference
    readonly UNIQUE_CONSTRAINT_VIOLATION_CODE = 'P2002';

    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findByEmail(email: string): Promise<User> {
        const row = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!row) {
            throw new UserNotFoundByEmailException(email);
        }
        return {
            id: row.id,
            email: row.email,
            passwordHash: row.passwordHash,
            role: row.role as Role,
        };
    }

    async findById(id: number): Promise<User> {
        const row = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!row) {
            throw new UserNotFoundByIdException(id);
        }
        return {
            id: row.id,
            email: row.email,
            passwordHash: row.passwordHash,
            role: row.role as Role,
        };
    }

    async create(user: CreateUser): Promise<User> {
        try {
            const row = await this.prisma.user.create({ data: user });
            return {
                id: row.id,
                email: row.email,
                passwordHash: row.passwordHash,
                role: row.role as Role,
            };
        } catch (e: unknown) {
            if (e instanceof Error && 'code' in e && e.code === this.UNIQUE_CONSTRAINT_VIOLATION_CODE) {
                throw new UserConflictException(user.email);
            }
            throw e;
        }
    }
}

@Injectable()
export class InMemoryUserRepository extends UserRepository {
    private users: User[] = [];

    async findByEmail(email: string): Promise<User> {
        return new Promise((resolve) => {
            const user = this.users.find((user) => user.email === email);
            if (!user) {
                throw new UserNotFoundByEmailException(email);
            }
            resolve(user);
        });
    }

    async findById(id: number): Promise<User> {
        return new Promise((resolve) => {
            const user = this.users.find((u) => u.id === id);
            if (!user) {
                throw new UserNotFoundByIdException(id);
            }
            resolve(user);
        });
    }

    async create(user: CreateUser): Promise<User> {
        return new Promise((resolve) => {
            const newUser: User = { ...user, id: this.users.length + 1 };
            this.users.push(newUser);
            resolve(newUser);
        });
    }
}
