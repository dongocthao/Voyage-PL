import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AnalyzerSimulationDto,
  CargoReletCalculationDto,
  FreightSimulationDto,
  TimeCharterCalculationDto,
} from './dto/estimate-simulation.dto';
import { SaveCargoReletEstimateDto } from './dto/cargo-relet-snapshot.dto';
import { SaveVoyageEstimateDto } from './dto/voyage-estimate-snapshot.dto';
import { SaveTimeCharterEstimateDto } from './dto/time-charter-snapshot.dto';
import { EstimateSimulationService } from './services/estimate-simulation.service';
import { CargoReletEstimateSnapshotService } from './services/cargo-relet-estimate-snapshot.service';
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
  ) {}

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
