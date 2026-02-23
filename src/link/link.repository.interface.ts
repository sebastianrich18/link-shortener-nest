import { CreateLink, Link } from './link.dto';

export abstract class LinkRepository {
    abstract findBySlug(slug: string): Promise<Link>;
    abstract create(link: CreateLink): Promise<void>;
    abstract update(link: Link): Promise<void>;
}
