import { JwtPayload } from 'jsonwebtoken';

export interface AuthTokenPayload extends JwtPayload {
    sub: string; // narrows from optional to required
    role: string;
}
