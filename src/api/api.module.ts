import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';
import { BitacoraAsset, BitacoraAssetSchema } from 'src/bitacora/schema/bitacoraAsset.schema';
import { Asset, AssetSchema } from 'src/asset/schema/asset.schema';
import { Delivery, DeliverySchema } from 'src/delivery/schema/delivery.schema';
// import { RolesGuard } from './roles.guard';

@Module({
    imports: [
        HttpModule,
        MongooseModule.forFeature([
          {name:Bitacora.name, schema:BitacoraSchema},
          {name:BitacoraAsset.name, schema:BitacoraAssetSchema},
          { name: Asset.name, schema: AssetSchema},
          {name: Delivery.name, schema:DeliverySchema}
        ]),
    ],
    providers: [],
    controllers: [ApiController],
  })
export class ApiModule {}