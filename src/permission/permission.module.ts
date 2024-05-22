import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Permission, PermissionSchema } from './schema/permission.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports:[MongooseModule.forFeature([
    { name:Permission.name, schema:PermissionSchema },
  ]),
  HttpModule,
],
  controllers: [PermissionController],
  providers: [PermissionService]
})
export class PermissionModule {}
