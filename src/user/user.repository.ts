import { UserConflictException, UserNotFoundByEmailException, UserNotFoundByIdException } from './user.exception';
import { UserRepository } from './userRepository.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { User } from './user.dto';

@Injectable()
export class PrismaUserRepository extends UserRepository {
    // https://docs.prisma.io/docs/orm/reference/error-reference
    readonly UNIQUE_CONSTRAINT_VIOLATION_CODE = 'P2002';

    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findByEmail(email: string): Promise<User> {
        const user = (await this.prisma.user.findUnique({
            where: { email },
        })) as User;
        if (!user) {
            throw new UserNotFoundByEmailException(email);
        }
        return user;
    }

    async findById(id: number): Promise<User> {
        const user = (await this.prisma.user.findUnique({
            where: { id },
        })) as User;
        if (!user) {
            throw new UserNotFoundByIdException(id);
        }
        return user;
    }

    async create(user: User): Promise<User> {
        try {
            return (await this.prisma.user.create({ data: user })) as User;
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

    async create(user: User): Promise<User> {
        return new Promise((resolve) => {
            const newUser = { ...user, id: this.users.length + 1 };
            this.users.push(newUser);
            resolve(newUser);
        });
    }
}
