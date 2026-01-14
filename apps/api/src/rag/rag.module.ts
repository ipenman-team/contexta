import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RagController } from './rag.controller';
import { RagIndexService } from './rag.index.service';
import { RagService } from './rag.service';

@Module({
  imports: [PrismaModule],
  controllers: [RagController],
  providers: [RagService, RagIndexService],
  exports: [RagService, RagIndexService],
})
export class RagModule {}
