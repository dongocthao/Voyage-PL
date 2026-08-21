import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpsertSystemOptionsDto } from './dto/app-settings.dto';
import { UpsertCargoMasterDto } from './dto/cargo-master.dto';
import { UpsertCompanyMasterDto } from './dto/company-master.dto';
import { UpsertPortMasterDto } from './dto/port-master.dto';
import { UpsertVesselMasterDto } from './dto/vessel-master.dto';
import { MasterDataService } from './master-data.service';

@ApiTags('master-data')
@Controller('master-data')
export class MasterDataController {
  constructor(private readonly masterData: MasterDataService) {}

  @Get('settings/system-options')
  systemOptions() {
    return this.masterData.systemOptions();
  }

  @Put('settings/system-options')
  saveSystemOptions(@Body() body: UpsertSystemOptionsDto) {
    return this.masterData.saveSystemOptions(body);
  }

  @Get('cargoes')
  cargoes(@Query('q') query?: string) {
    return this.masterData.cargoes(query);
  }

  @Get('cargoes/:id')
  cargo(@Param('id') id: string) {
    return this.masterData.cargo(id);
  }

  @Post('cargoes')
  createCargo(@Body() body: UpsertCargoMasterDto) {
    return this.masterData.createCargo(body);
  }

  @Put('cargoes/:id')
  updateCargo(@Param('id') id: string, @Body() body: UpsertCargoMasterDto) {
    return this.masterData.updateCargo(id, body);
  }

  @Get('ports')
  ports(@Query('q') query?: string) {
    return this.masterData.ports(query);
  }

  @Get('countries')
  countries(@Query('q') query?: string) {
    return this.masterData.countries(query);
  }

  @Get('port-types')
  portTypes(@Query('q') query?: string) {
    return this.masterData.portTypes(query);
  }

  @Get('ports/:id')
  port(@Param('id') id: string) {
    return this.masterData.port(id);
  }

  @Post('ports')
  createPort(@Body() body: UpsertPortMasterDto) {
    return this.masterData.createPort(body);
  }

  @Put('ports/:id')
  updatePort(@Param('id') id: string, @Body() body: UpsertPortMasterDto) {
    return this.masterData.updatePort(id, body);
  }

  @Get('companies')
  companies(@Query('q') query?: string) {
    return this.masterData.companies(query);
  }

  @Get('companies/:id')
  company(@Param('id') id: string) {
    return this.masterData.company(id);
  }

  @Post('companies')
  createCompany(@Body() body: UpsertCompanyMasterDto) {
    return this.masterData.createCompany(body);
  }

  @Put('companies/:id')
  updateCompany(@Param('id') id: string, @Body() body: UpsertCompanyMasterDto) {
    return this.masterData.updateCompany(id, body);
  }

  @Get('cp-terms')
  cpTerms(@Query('q') query?: string) {
    return this.masterData.cpTerms(query);
  }

  @Get('laytime-terms')
  laytimeTerms(@Query('q') query?: string) {
    return this.masterData.laytimeTerms(query);
  }

  @Get('fuel-categories')
  fuelCategories(@Query('q') query?: string) {
    return this.masterData.fuelCategories(query);
  }

  @Get('fuel-types')
  fuelTypes(
    @Query('q') query?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.masterData.fuelTypes({ query, categoryId });
  }

  @Get('fuel-types/eca-compliant')
  fuelTypesEcaCompliant(@Query('q') query?: string) {
    return this.masterData.fuelTypes({ query, ecaOnly: true });
  }

  @Get('vessel-kinds')
  vesselKinds(@Query('q') query?: string) {
    return this.masterData.vesselKinds(query);
  }

  @Get('vessel-types')
  vesselTypes(
    @Query('q') query?: string,
    @Query('kindId') kindId?: string,
  ) {
    return this.masterData.vesselTypes({ query, kindId });
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
