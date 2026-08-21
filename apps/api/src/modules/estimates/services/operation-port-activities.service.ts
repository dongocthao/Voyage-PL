import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma.service';
import { SaveOperationPortActivitiesDto } from '../dto/operation-port-activities.dto';

@Injectable()
export class OperationPortActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async saveSummary(body: SaveOperationPortActivitiesDto) {
    const operationId = toBigInt(body.operationId, 'operationId');
    const operation = await this.prisma.actual_voyages.findUnique({
      where: { id: operationId },
      select: { id: true },
    });
    if (!operation) {
      throw new BadRequestException('Operation was not found.');
    }

    const portId = await this.resolvePortId(body.portName);

    await this.prisma.$executeRaw`
      INSERT INTO operation_port_activity_statistics (
        port_rotation_id,
        port_id,
        voyage_id,
        operation_id,
        channel_days,
        port_working_days,
        port_idle_days,
        port_margin_day,
        port_stay_duration,
        updated_at
      )
      VALUES (
        ${body.portRotationId},
        ${portId},
        ${operationId},
        ${operationId},
        ${new Prisma.Decimal(body.channelDays)},
        ${new Prisma.Decimal(body.portWorkingDays)},
        ${new Prisma.Decimal(body.portIdleDays)},
        ${new Prisma.Decimal(body.portMarginDay)},
        ${new Prisma.Decimal(body.portStayDuration)},
        now()
      )
      ON CONFLICT (operation_id, port_rotation_id)
      DO UPDATE SET
        port_id = EXCLUDED.port_id,
        voyage_id = EXCLUDED.voyage_id,
        channel_days = EXCLUDED.channel_days,
        port_working_days = EXCLUDED.port_working_days,
        port_idle_days = EXCLUDED.port_idle_days,
        port_margin_day = EXCLUDED.port_margin_day,
        port_stay_duration = EXCLUDED.port_stay_duration,
        updated_at = now()
    `;

    return {
      operationId: body.operationId,
      portRotationId: body.portRotationId,
      portId: portId?.toString() ?? null,
      channelDays: body.channelDays,
      portWorkingDays: body.portWorkingDays,
      portIdleDays: body.portIdleDays,
      portMarginDay: body.portMarginDay,
      portStayDuration: body.portStayDuration,
    };
  }

  private async resolvePortId(portName?: string) {
    const name = cleanPortName(portName);
    if (!name) return null;
    const row = await this.prisma.ports.findFirst({
      where: { port_name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    return row?.id ?? null;
  }
}

function cleanPortName(value?: string) {
  return value?.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();
}

function toBigInt(value: string, name: string) {
  try {
    return BigInt(value);
  } catch {
    throw new BadRequestException(`Invalid ${name}`);
  }
}
