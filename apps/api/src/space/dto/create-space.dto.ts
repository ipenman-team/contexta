import type { Prisma, SpaceType } from '@prisma/client';

export type CreateSpaceDto = {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  identifier?: string;
  type?: SpaceType | string;
  metadata?: Prisma.JsonValue;
};
