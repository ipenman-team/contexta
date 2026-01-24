import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, SpaceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { ListSpaceQuery } from './dto/list-space.query';

import { SpaceDto } from './dto/space.dto';

@Injectable()
export class SpaceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    input: CreateSpaceDto,
    userId?: string,
  ): Promise<SpaceDto> {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!input?.name) throw new BadRequestException('name is required');

    const actor = userId?.trim() || 'system';

    const created = await this.prisma.space.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description ?? null,
        icon: input.icon ?? null,
        color: input.color ?? null,
        identifier: input.identifier ?? null,
        type: (input.type as SpaceType) ?? 'ORG',
        metadata: input.metadata || {},
        createdBy: actor,
        updatedBy: actor,
      },
    });

    return created as unknown as SpaceDto;
  }

  async list(tenantId: string, q?: ListSpaceQuery) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const skip = Number(q?.skip) ?? 0;
    const take = Number(q?.take) ?? 50;
    const where: Prisma.SpaceWhereInput & { isArchived?: boolean } = {
      tenantId,
      isDeleted: false,
    };
    if (!q?.includeArchived) {
      // default exclude archived
      where.isArchived = false;
    }
    if (q?.q) {
      where.OR = [
        { name: { contains: q.q, mode: 'insensitive' } },
        { identifier: { contains: q.q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.space.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.space.count({ where });

    return { items, total };
  }

  async get(tenantId: string, id: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!id) throw new BadRequestException('id is required');

    const space = await this.prisma.space.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!space) throw new NotFoundException('space not found');
    return space as unknown as SpaceDto;
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateSpaceDto,
    userId?: string,
  ) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!id) throw new BadRequestException('id is required');

    const actor = userId?.trim() || 'system';

    const existing = await this.prisma.space.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('space not found');

    const updated = await this.prisma.space.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        description:
          input.description === undefined
            ? existing.description
            : input.description,
        icon: input.icon === undefined ? existing.icon : input.icon,
        color: input.color === undefined ? existing.color : input.color,
        identifier:
          input.identifier === undefined
            ? existing.identifier
            : input.identifier,
        type: (input.type as SpaceType) ?? existing.type,
        metadata:
          input.metadata === undefined
            ? existing.metadata || {}
            : input.metadata || {},
        updatedBy: actor,
      },
    });

    return updated as unknown as SpaceDto;
  }

  async remove(tenantId: string, id: string, userId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!id) throw new BadRequestException('id is required');

    const actor = userId?.trim() || 'system';

    const existing = await this.prisma.space.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('space not found');

    const result = await this.prisma.space.update({
      where: { id },
      data: { isDeleted: true, updatedBy: actor },
    });

    return { ok: true, space: result };
  }
}
