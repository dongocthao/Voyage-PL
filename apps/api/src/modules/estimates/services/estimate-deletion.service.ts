import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppErrorCode } from '../../../common/errors/app-error-code';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class EstimateDeletionService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(estimateId: string) {
    const parsedEstimateId = BigInt(estimateId);

    const existingEstimate = await this.prisma.estimates.findUnique({
      where: { id: parsedEstimateId },
      select: { id: true },
    });

    if (!existingEstimate) {
      throw new NotFoundException({
        code: AppErrorCode.ESTIMATE_NOT_FOUND,
        message: 'Estimate was not found.',
        details: [{ path: 'estimateId', message: estimateId }],
      });
    }

    const linkedOperation = await this.prisma.actual_voyages.findFirst({
      where: { estimate_id: parsedEstimateId },
      select: { id: true, voyage_code: true },
    });

    if (linkedOperation) {
      throw new BadRequestException({
        code: AppErrorCode.BUSINESS_RULE_VIOLATION,
        message: 'Cannot delete this estimate because an operation already exists.',
        details: [
          { path: 'estimateId', message: estimateId },
          { path: 'operationId', message: linkedOperation.id.toString() },
        ],
      });
    }

    await this.prisma.estimates.delete({ where: { id: parsedEstimateId } });
    return { estimateId, deleted: true as const };
  }
}
