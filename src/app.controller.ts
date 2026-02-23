import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
    @Get('health')
    @ApiOperation({ summary: 'Health check' })
    @ApiOkResponse({ description: 'Service is healthy' })
    healthCheck() {
        return { status: 'ok' };
    }
}
