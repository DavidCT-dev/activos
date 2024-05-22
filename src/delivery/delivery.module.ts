import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Delivery, DeliverySchema } from './schema/delivery.schema';
import { AssetService } from 'src/asset/asset.service';
import { Asset, AssetSchema } from 'src/asset/schema/asset.schema';
import { CustomErrorService } from 'src/error.service';
import { HttpModule } from '@nestjs/axios';
import { DeliveryCertificate } from './delivery.certificate.service';
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';
import { State, StateSchema } from 'src/state/schema/state.schema';
import { DocumentPdf } from 'src/asset/asset.documentPdf.service';
import { Supplier, SupplierSchema } from 'src/supplier/schema/supplier.schema';
import { DeliveryMiddleware } from 'src/middleware/middleware.delivery';
import { BitacoraAsset, BitacoraAssetSchema } from 'src/bitacora/schema/bitacoraAsset.schema';

@Module({
  imports:[MongooseModule.forFeature([
    {name: Delivery.name, schema:DeliverySchema},
    { name: Asset.name, schema: AssetSchema},
    {name:Bitacora.name, schema:BitacoraSchema},
    {name:State.name, schema:StateSchema},
    {name:Supplier.name, schema:SupplierSchema},
    {name:BitacoraAsset.name, schema:BitacoraAssetSchema}
  ]),
  HttpModule
],
  controllers: [DeliveryController],
  providers: [        
    DeliveryService,
    CustomErrorService,
    DeliveryCertificate,
    DocumentPdf
  ]
})
export class DeliveryModule {
  // configure(consumer: MiddlewareConsumer){
  //   consumer.apply(DeliveryMiddleware).forRoutes(
  //     { path: '/delivery', method: RequestMethod.POST },
  //     )
  // }
}
