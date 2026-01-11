import type { PageVersionStatus } from '@prisma/client';

export type PageVersionDto = {
  id: string;
  tenantId: string;
  pageId: string;
  status: PageVersionStatus;
  title: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
};
