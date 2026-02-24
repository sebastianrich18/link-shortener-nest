import { UserContextDto } from '../user.dto';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user: UserContextDto;
}
