import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AnalyzerSimulationDto,
  CargoReletCalculationDto,
  FreightSimulationDto,
  TimeCharterCalculationDto,
} from './dto/estimate-simulation.dto';
import { SaveVoyageEstimateDto } from './dto/voyage-estimate-snapshot.dto';
import { EstimateSimulationService } from './services/estimate-simulation.service';
import { VoyageEstimateSnapshotService } from './services/voyage-estimate-snapshot.service';

@ApiTags('estimates')
@Controller('estimates')
export class EstimatesController {
  constructor(
    private readonly voyageSnapshots: VoyageEstimateSnapshotService,
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
