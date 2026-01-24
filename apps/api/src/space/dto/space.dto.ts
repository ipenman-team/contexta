export type SpaceDto = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  identifier?: string | null;
  type: string;
  isArchived: boolean;
  metadata?: unknown | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
