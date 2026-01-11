import type { Prisma } from '@prisma/client';

export type CreatePageDto = {
  title: string;
  content?: Prisma.JsonValue;
  parentIds?: string[];
};
