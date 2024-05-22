import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { GetUfvService } from './get-ufv.service';
import { GetUfvController } from './get-ufv.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ufv, UfvSchema } from './schema/ufvs.schema';
import { CustomErrorService } from 'src/error.service';
import { UfvBcbMiddleware } from 'src/middleware/middleware.ufv.bcb';
import { Permission, PermissionSchema } from 'src/permission/schema/permission.schema';
import { HttpModule } from '@nestjs/axios';
import { Asset, AssetSchema } from 'src/asset/schema/asset.schema';
import { DepreciationAssetList, DepreciationAssetListSchema } from 'src/depreciation-asset-list/schema/depreciation-asset';
import { Supplier, SupplierSchema } from 'src/supplier/schema/supplier.schema';
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: Ufv.name, schema:UfvSchema},
      { name:Permission.name, schema:PermissionSchema },
      {name:Bitacora.name, schema:BitacoraSchema},
      { name: Asset.name, schema: AssetSchema}
    ]),
    HttpModule
  ],
  controllers: [GetUfvController],
  providers: [
    GetUfvService,
    CustomErrorService,
    
  ]
})
export class GetUfvModule {
  configure(consumer: MiddlewareConsumer){
      consumer.apply(UfvBcbMiddleware).forRoutes(
        { path: '/get-ufv', method: RequestMethod.POST },
        
      );
  }
  
}
