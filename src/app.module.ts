import { Global, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AssetModule } from './asset/asset.module';
import { ApiController } from './api/api.controller';
import { HttpModule } from '@nestjs/axios';
import { DepreciationAssetListModule } from './depreciation-asset-list/depreciation-asset-list.module';
import configuration from './config/configuration';
import getConfig from './config/configuration'
import { ScheduleModule } from '@nestjs/schedule';
import { SupplierModule } from './supplier/supplier.module';
import { AssetMiddleware } from './middleware/middleware.asset';
import { PersonalModule } from './personal/personal.module';
import { CustomErrorService } from './error.service';
import { GetUfvModule } from './get-ufv/get-ufv.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { BitacoraModule } from './bitacora/bitacora.module';
import { Bitacora, BitacoraSchema } from './bitacora/schema/bitacora.schema';
import { PermissionModule } from './permission/permission.module';
import { Permission, PermissionSchema } from './permission/schema/permission.schema';
import { ReportsModule } from './reports/reports.module';
import { DeliveryModule } from './delivery/delivery.module';
import { DevolutionModule } from './devolution/devolution.module';
import { QueryParamsValidationMiddleware } from './middleware/middleware.filter';
import { StateModule } from './state/state.module';
import { OrganigramaModule } from './organigrama/organigrama.module';
import { Asset, AssetSchema } from './asset/schema/asset.schema';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    ConfigModule.forRoot(
      {
        isGlobal:true,
        load: [configuration],
      }
    ),
    MongooseModule.forRoot(getConfig().mongodb,
   //'mongodb://fundation:freefundation221@10.10.214.219:27020/',
      {
        dbName:getConfig().db_name//'activo'
      }
    ),
    MongooseModule.forFeature([
      {name:Bitacora.name, schema:BitacoraSchema},
      { name: Asset.name, schema: AssetSchema}
    ]),
    
    ApiModule,
    AssetModule,
    DepreciationAssetListModule,
    SupplierModule,
    PersonalModule,
    OrganigramaModule,
    GetUfvModule,
    BitacoraModule,
    PermissionModule,
    ReportsModule,
    DeliveryModule,
    DevolutionModule,
    StateModule,
  ],
  providers: [CustomErrorService],
  controllers: [ApiController],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer){
    consumer.apply(LoggerMiddleware).forRoutes(
      { path: '/get-ufv', method: RequestMethod.POST },
      { path: '/get-ufv/find-ufv-current', method: RequestMethod.POST },

      { path:'/asset/*',method: RequestMethod.PUT},
      { path:'/asset/*',method: RequestMethod.DELETE},
      { path: '/asset', method: RequestMethod.POST },
      { path: '/asset', method: RequestMethod.GET },
      { path: '/asset//get-asset-generate-QR', method: RequestMethod.POST },
      
      //{ path: '/asset/get-asset-document-pdf/*', method: RequestMethod.GET },

      { path: '/bitacora/bitacora', method: RequestMethod.GET },
      { path: '/bitacora/bitacora-asset', method: RequestMethod.GET },


      { path: '/reports', method: RequestMethod.ALL },

      { path: '/delivery', method: RequestMethod.POST },
      { path: '/delivery/*', method: RequestMethod.PUT },
      { path: '/delivery/*', method: RequestMethod.DELETE },

      // { path: '/personal', method: RequestMethod.ALL },

      { path: '/devolution', method: RequestMethod.POST },
      { path: '/devolution/*', method: RequestMethod.PUT },
      { path: '/devolution/*', method: RequestMethod.DELETE },
      
      { path: '/transfers', method: RequestMethod.POST },
      { path: '/transfers/*', method: RequestMethod.PUT },
      { path: '/transfers/*', method: RequestMethod.DELETE },

      { path: '/depreciation-asset-list', method: RequestMethod.POST },
      { path: '/depreciation-asset-list/*', method: RequestMethod.PUT },
      { path: '/depreciation-asset-list/*', method: RequestMethod.DELETE },
      { path: '/depreciation-asset-list', method: RequestMethod.GET },

      { path: '/supplier', method: RequestMethod.POST },
      { path: '/supplier', method: RequestMethod.GET },
      { path: '/supplier/*', method: RequestMethod.PUT },
      { path: '/supplier/*', method: RequestMethod.DELETE },
      

      // { path: '/api/redirect-to-main', method: RequestMethod.POST },

      { path: '/state', method: RequestMethod.POST },
      { path: '/state', method: RequestMethod.GET },
      { path: '/state/*', method: RequestMethod.PUT },
      { path: '/state/*', method: RequestMethod.DELETE },

      { path: '/permission/*', method: RequestMethod.PUT },
      { path: '/permission/*', method: RequestMethod.DELETE },
      // { path: '/permission', method: RequestMethod.POST },
      )

      .apply(QueryParamsValidationMiddleware).forRoutes(
        { path: '/asset', method: RequestMethod.GET },
      );
  }
  
}
