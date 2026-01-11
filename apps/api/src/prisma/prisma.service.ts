import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

type PrismaClientLike = {
  page: PrismaClient['page'];
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
};

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client!: PrismaClientLike;

  get page() {
    return this.client.page;
  }

  async onModuleInit() {
    const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
      .process?.env;

    if (env?.PRISMA_CLIENT === 'edge') {
      const mod = await import('@prisma/client/edge');
      this.client = new mod.PrismaClient() as unknown as PrismaClientLike;
    } else {
      this.client = new PrismaClient();
    }

    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
