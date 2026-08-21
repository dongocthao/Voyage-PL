import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MasterDataService } from './master-data.service';

@ApiTags('vessel-catalog')
@Controller('vessels')
export class VesselCatalogAliasController {
  constructor(private readonly masterData: MasterDataService) {}

  @Get('kinds')
  kinds(@Query('q') query?: string) {
    return this.masterData.vesselKinds(query);
  }

  @Get('types')
  types(
    @Query('q') query?: string,
    @Query('kindId') kindId?: string,
  ) {
    return this.masterData.vesselTypes({ query, kindId });
  }
}

@ApiTags('bunker-catalog')
@Controller('bunker')
export class BunkerCatalogAliasController {
  constructor(private readonly masterData: MasterDataService) {}

  @Get('categories')
  categories(@Query('q') query?: string) {
    return this.masterData.fuelCategories(query);
  }

  @Get('fuels')
  fuels(
    @Query('q') query?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.masterData.fuelTypes({ query, categoryId });
  }

  @Get('fuels/eca-compliant')
  ecaCompliant(@Query('q') query?: string) {
    return this.masterData.fuelTypes({ query, ecaOnly: true });
  }
}
