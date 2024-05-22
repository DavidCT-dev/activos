import { Module } from '@nestjs/common';
import { PersonalController } from './personal.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Ufv, UfvSchema } from 'src/get-ufv/schema/ufvs.schema';
import { Permission, PermissionSchema } from 'src/permission/schema/permission.schema';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name:Permission.name, schema:PermissionSchema },
    ]),
    HttpModule
  ],
  controllers: [PersonalController],
  providers: []
})
export class PersonalModule {}
