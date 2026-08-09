import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { MasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';

@Module({
  controllers: [MasterDataController],
  providers: [PrismaService, MasterDataService],
})
export class MasterDataModule {}
