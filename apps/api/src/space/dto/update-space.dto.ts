import type { Prisma, SpaceType } from '@prisma/client';

export type UpdateSpaceDto = {
  name?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  identifier?: string | null;
  type?: SpaceType | string;
  metadata?: Prisma.JsonValue | null;
};
