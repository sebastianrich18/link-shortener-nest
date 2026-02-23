import { CreateUser, User } from './user.dto';

// abstract class rather than interface to make DI cleaner with NestJS
export abstract class UserRepository {
    abstract findById(id: number): Promise<User>;
    abstract findByEmail(email: string): Promise<User>;
    abstract create(user: CreateUser): Promise<User>;
}
