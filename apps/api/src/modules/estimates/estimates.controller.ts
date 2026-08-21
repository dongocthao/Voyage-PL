import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AnalyzerSimulationDto,
  CargoReletCalculationDto,
  FreightSimulationDto,
  TimeCharterCalculationDto,
} from './dto/estimate-simulation.dto';
import { SaveCargoReletEstimateDto } from './dto/cargo-relet-snapshot.dto';
import { SaveOperationSnapshotDto } from './dto/operation-snapshot.dto';
import { SaveOperationPortActivitiesDto } from './dto/operation-port-activities.dto';
import { SaveVoyageEstimateDto } from './dto/voyage-estimate-snapshot.dto';
import { SaveTimeCharterEstimateDto } from './dto/time-charter-snapshot.dto';
import { EstimateSimulationService } from './services/estimate-simulation.service';
import { EstimateListService } from './services/estimate-list.service';
import { EstimateDeletionService } from './services/estimate-deletion.service';
import { CargoReletEstimateSnapshotService } from './services/cargo-relet-estimate-snapshot.service';
import { OperationSnapshotService } from './services/operation-snapshot.service';
import { OperationPortActivitiesService } from './services/operation-port-activities.service';
import { TimeCharterEstimateSnapshotService } from './services/time-charter-estimate-snapshot.service';
import { VoyageEstimateSnapshotService } from './services/voyage-estimate-snapshot.service';

@ApiTags('estimates')
@Controller('estimates')
export class EstimatesController {
  constructor(
    private readonly voyageSnapshots: VoyageEstimateSnapshotService,
    private readonly timeCharterSnapshots: TimeCharterEstimateSnapshotService,
    private readonly cargoReletSnapshots: CargoReletEstimateSnapshotService,
    private readonly simulations: EstimateSimulationService,
    private readonly estimateList: EstimateListService,
    private readonly estimateDeletion: EstimateDeletionService,
    private readonly operationSnapshots: OperationSnapshotService,
    private readonly operationPortActivities: OperationPortActivitiesService,
  ) {}

  @Get()
  listEstimates() {
    return this.estimateList.list();
  }

  @Get('operations')
  listOperations() {
    return this.operationSnapshots.list();
  }

  @Delete(':estimateId')
  deleteEstimate(@Param('estimateId') estimateId: string) {
    return this.estimateDeletion.delete(estimateId);
  }

  @Post('voyage-snapshots')
  saveVoyageSnapshot(@Body() body: SaveVoyageEstimateDto) {
    return this.voyageSnapshots.save(body);
  }

  @Get('voyage-snapshots/:estimateId')
  loadVoyageSnapshot(@Param('estimateId') estimateId: string) {
    return this.voyageSnapshots.load(estimateId);
  }

  @Get('voyage-snapshots/:estimateId/report-summary')
  voyageReportSummary(@Param('estimateId') estimateId: string) {
    return this.voyageSnapshots.reportSummary(estimateId);
  }

  @Post('time-charter-snapshots')
  saveTimeCharterSnapshot(@Body() body: SaveTimeCharterEstimateDto) {
    return this.timeCharterSnapshots.save(body);
  }

  @Get('time-charter-snapshots/:estimateId')
  loadTimeCharterSnapshot(@Param('estimateId') estimateId: string) {
    return this.timeCharterSnapshots.load(estimateId);
  }

  @Post('cargo-relet-snapshots')
  saveCargoReletSnapshot(@Body() body: SaveCargoReletEstimateDto) {
    return this.cargoReletSnapshots.save(body);
  }

  @Get('cargo-relet-snapshots/:estimateId')
  loadCargoReletSnapshot(@Param('estimateId') estimateId: string) {
    return this.cargoReletSnapshots.load(estimateId);
  }

  @Post('operation-snapshots')
  saveOperationSnapshot(@Body() body: SaveOperationSnapshotDto) {
    return this.operationSnapshots.save(body);
  }

  @Get('operation-snapshots/by-estimate/:estimateId')
  findOperationByEstimate(@Param('estimateId') estimateId: string) {
    return this.operationSnapshots.findByEstimateId(estimateId);
  }

  @Get('operation-snapshots/:operationId')
  loadOperationSnapshot(@Param('operationId') operationId: string) {
    return this.operationSnapshots.load(operationId);
  }

  @Delete('operation-snapshots/:operationId')
  deleteOperationSnapshot(@Param('operationId') operationId: string) {
    return this.operationSnapshots.delete(operationId);
  }

  @Post('operation-port-activities')
  saveOperationPortActivities(@Body() body: SaveOperationPortActivitiesDto) {
    return this.operationPortActivities.saveSummary(body);
  }

  @Post('voyage-simulations/freight')
  simulateFreight(@Body() body: FreightSimulationDto) {
    return this.simulations.simulateFreight(body);
  }

  @Post('voyage-simulations/analyzer')
  simulateAnalyzer(@Body() body: AnalyzerSimulationDto) {
    return this.simulations.simulateAnalyzer(body);
  }

  @Post('cargo-relet/calculate')
  calculateCargoRelet(@Body() body: CargoReletCalculationDto) {
    return this.simulations.calculateCargoRelet(body);
  }

  @Post('time-charter/calculate')
  calculateTimeCharter(@Body() body: TimeCharterCalculationDto) {
    return this.simulations.calculateTimeCharter(body);
  }
}
