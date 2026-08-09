import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { VoyageCalculationEngine } from './calculation/voyage-calculation.engine';
import { EstimatesController } from './estimates.controller';
import { EstimateSimulationService } from './services/estimate-simulation.service';
import { VoyageEstimateSnapshotService } from './services/voyage-estimate-snapshot.service';
import { VoyageEstimateInputValidator } from './validators/voyage-estimate-input.validator';

@Module({
  controllers: [EstimatesController],
  providers: [
    PrismaService,
    VoyageCalculationEngine,
    EstimateSimulationService,
    VoyageEstimateInputValidator,
    VoyageEstimateSnapshotService,
  ],
})
export class EstimatesModule {}
