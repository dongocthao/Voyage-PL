import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpsertVesselMasterDto } from './dto/vessel-master.dto';
import { MasterDataService } from './master-data.service';

@ApiTags('master-data')
@Controller('master-data')
export class MasterDataController {
  constructor(private readonly masterData: MasterDataService) {}

  @Get('cargoes')
  cargoes(@Query('q') query?: string) {
    return this.masterData.cargoes(query);
  }

  @Get('ports')
  ports(@Query('q') query?: string) {
    return this.masterData.ports(query);
  }

  @Get('companies')
  companies(@Query('q') query?: string) {
    return this.masterData.companies(query);
  }

  @Get('cp-terms')
  cpTerms(@Query('q') query?: string) {
    return this.masterData.cpTerms(query);
  }

  @Get('laytime-terms')
  laytimeTerms(@Query('q') query?: string) {
    return this.masterData.laytimeTerms(query);
  }

  @Get('fuel-types')
  fuelTypes(@Query('q') query?: string) {
    return this.masterData.fuelTypes(query);
  }

  @Get('vessel-kinds')
  vesselKinds(@Query('q') query?: string) {
    return this.masterData.vesselKinds(query);
  }

  @Get('vessel-types')
  vesselTypes(@Query('q') query?: string) {
    return this.masterData.vesselTypes(query);
  }

  @Get('expense-categories')
  expenseCategories(@Query('q') query?: string) {
    return this.masterData.expenseCategories(query);
  }

  @Get('vessels')
  vessels(@Query('q') query?: string) {
    return this.masterData.vessels(query);
  }

  @Get('vessels/:id')
  vessel(@Param('id') id: string) {
    return this.masterData.vessel(id);
  }

  @Post('vessels')
  createVessel(@Body() body: UpsertVesselMasterDto) {
    return this.masterData.createVessel(body);
  }

  @Put('vessels/:id')
  updateVessel(@Param('id') id: string, @Body() body: UpsertVesselMasterDto) {
    return this.masterData.updateVessel(id, body);
  }

  @Get('bunker-profiles')
  bunkerProfiles(
    @Query('vesselId') vesselId?: string,
    @Query('q') query?: string,
  ) {
    return this.masterData.bunkerProfiles({ vesselId, query });
  }
}
