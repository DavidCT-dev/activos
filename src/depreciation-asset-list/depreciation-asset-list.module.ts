import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { DepreciationAssetListService } from './depreciation-asset-list.service';
import { DepreciationAssetListController } from './depreciation-asset-list.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DepreciationAssetList,
  DepreciationAssetListSchema,
} from './schema/depreciation-asset';
import { HttpModule } from '@nestjs/axios';
import { GroupCountableMiddleware } from 'src/middleware/middleware.group.countable';
import { Permission, PermissionSchema } from 'src/permission/schema/permission.schema';
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';
import { Asset, AssetSchema } from 'src/asset/schema/asset.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DepreciationAssetList.name, schema: DepreciationAssetListSchema },
      { name:Permission.name, schema:PermissionSchema },
      {name:Bitacora.name, schema:BitacoraSchema},
      { name: Asset.name, schema: AssetSchema}
    ]),
    HttpModule,
  ],
  controllers: [DepreciationAssetListController],
  providers: [DepreciationAssetListService],
})
export class DepreciationAssetListModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GroupCountableMiddleware)
      .forRoutes(
        { path: '/depreciation-asset-list', method: RequestMethod.POST },
        { path: '/depreciation-asset-list/:id', method: RequestMethod.PUT },
      );
  }
}
