import { Module } from '@nestjs/common';
import { OrganigramaController } from './organigrama.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Permission, PermissionSchema } from 'src/permission/schema/permission.schema';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name:Permission.name, schema:PermissionSchema },
    ]),
    HttpModule
  ],
  controllers: [OrganigramaController],
  providers: []
})
export class OrganigramaModule {}
