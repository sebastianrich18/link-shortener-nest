import { PipeTransform, BadRequestException } from '@nestjs/common';
import type { z } from 'zod';

export class ZodValidationPipe implements PipeTransform {
    constructor(private readonly schema: z.ZodType) {}

    transform(value: unknown): unknown {
        const result = this.schema.safeParse(value);
        if (result.success) {
            return result.data;
        }

        throw new BadRequestException({
            message: 'Validation failed',
            errors: result.error.issues,
        });
    }
}
