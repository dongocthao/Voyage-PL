import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  BunkerCatalogAliasController,
  VesselCatalogAliasController,
} from './catalog-alias.controller';
import { MasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';

@Module({
  controllers: [
    MasterDataController,
    VesselCatalogAliasController,
    BunkerCatalogAliasController,
  ],
  providers: [PrismaService, MasterDataService],
})
export class MasterDataModule {}
