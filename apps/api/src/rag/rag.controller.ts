import { Body, Controller, Headers, Post } from '@nestjs/common';
import { TenantId } from '../common/tenant/tenant-id.decorator';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('answer')
  answer(
    @TenantId() tenantId: string,
    @Headers('x-user-id') _userId: string | undefined,
    @Body() body: { question?: unknown },
  ) {
    const question = typeof body?.question === 'string' ? body.question : '';
    return this.ragService.answer(tenantId, question);
  }
}
