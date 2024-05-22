import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Asset, AssetSchema } from 'src/asset/schema/asset.schema';
import { HttpModule } from '@nestjs/axios';
import { Ufv, UfvSchema } from 'src/get-ufv/schema/ufvs.schema';
import { DepreciationAssetListSchema, DepreciationAssetList } from 'src/depreciation-asset-list/schema/depreciation-asset';
import { GetUfvService } from 'src/get-ufv/get-ufv.service';
import { DepreciationService } from 'src/asset/depreciation.service';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
      { name: Ufv.name, schema:UfvSchema },
      { name: DepreciationAssetList.name, schema:DepreciationAssetListSchema }
    ]),
    HttpModule
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    GetUfvService,
    DepreciationService,
  ]
})
export class ReportsModule {}
