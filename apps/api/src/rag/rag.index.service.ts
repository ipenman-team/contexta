import { Injectable } from '@nestjs/common';
import { RagService } from './rag.service';

@Injectable()
export class RagIndexService {
  constructor(private readonly ragService: RagService) {}

  startIndexPublished(args: {
    tenantId: string;
    pageId: string;
    pageVersionId: string;
  }) {
    void (async () => {
      try {
        await this.ragService.indexPublished(
          args.tenantId,
          args.pageId,
          args.pageVersionId,
        );
      } catch (error) {
        // 不阻塞 publish；失败交由日志/后续可观测体系处理
        console.error('[RAG][index_failed]', {
          tenantId: args.tenantId,
          pageId: args.pageId,
          pageVersionId: args.pageVersionId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
  }
}
