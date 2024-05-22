import { Module } from '@nestjs/common';
import { BitacoraService } from './bitacora.service';
import { BitacoraController } from './bitacora.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bitacora, BitacoraSchema } from './schema/bitacora.schema';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
import { HttpModule } from '@nestjs/axios';
import { CustomErrorService } from 'src/error.service';
import {  LoggerAssetInterceptors } from 'src/interceptors/loggerAssetInterceptors';
import { BitacoraAsset, BitacoraAssetSchema } from './schema/bitacoraAsset.schema';
import { Asset, AssetSchema } from 'src/asset/schema/asset.schema';
import { Devolution, DevolutionSchema } from 'src/devolution/schema/devolution.schema';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:Bitacora.name, schema:BitacoraSchema},
      {name:BitacoraAsset.name, schema:BitacoraAssetSchema},
      {name: Asset.name, schema: AssetSchema},
      {name: Devolution.name, schema: DevolutionSchema}
    ]),
    HttpModule
  ],
  controllers: [BitacoraController],
  providers: [
    LoggerInterceptor,
    LoggerAssetInterceptors,
    BitacoraService,
    CustomErrorService
  ]
})
export class BitacoraModule {}
