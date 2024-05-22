import { Module } from '@nestjs/common';
import { StateService } from './state.service';
import { StateController } from './state.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { State, StateSchema } from './schema/state.schema';
import { Asset, AssetSchema } from 'src/asset/schema/asset.schema';
import { CustomErrorService } from 'src/error.service';
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: State.name, schema: StateSchema },
      { name: Asset.name, schema: AssetSchema },
      {name:Bitacora.name, schema:BitacoraSchema}
    ]),
    HttpModule,
  ],
  controllers: [StateController],
  providers: [StateService,CustomErrorService]
})
export class StateModule {}
