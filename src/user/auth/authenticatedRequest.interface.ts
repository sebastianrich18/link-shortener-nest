import { Request } from 'express';
import { UserContextDto } from '../user.dto';

export interface AuthenticatedRequest extends Request {
    user: UserContextDto;
}
