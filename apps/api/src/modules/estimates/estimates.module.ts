import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { VoyageCalculationEngine } from './calculation/voyage-calculation.engine';
import { EstimatesController } from './estimates.controller';
import { CargoReletEstimateSnapshotService } from './services/cargo-relet-estimate-snapshot.service';
import { EstimateDeletionService } from './services/estimate-deletion.service';
import { EstimateSimulationService } from './services/estimate-simulation.service';
import { EstimateListService } from './services/estimate-list.service';
import { OperationSnapshotService } from './services/operation-snapshot.service';
import { OperationPortActivitiesService } from './services/operation-port-activities.service';
import { TimeCharterEstimateSnapshotService } from './services/time-charter-estimate-snapshot.service';
import { VoyageEstimateSnapshotService } from './services/voyage-estimate-snapshot.service';
import { VoyageEstimateInputValidator } from './validators/voyage-estimate-input.validator';

@Module({
  controllers: [EstimatesController],
  providers: [
    PrismaService,
    VoyageCalculationEngine,
    CargoReletEstimateSnapshotService,
    EstimateDeletionService,
    EstimateListService,
    EstimateSimulationService,
    OperationPortActivitiesService,
    OperationSnapshotService,
    TimeCharterEstimateSnapshotService,
    VoyageEstimateInputValidator,
    VoyageEstimateSnapshotService,
  ],
})
export class EstimatesModule {}
