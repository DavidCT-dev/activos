import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/guard/roles.guard';
import { Permissions } from '../guard/decorators/permissions.decorator'
import { Permission } from 'src/guard/constants/permission';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';

@ApiTags('permission')
// @UseGuards(RolesGuard)

@Controller('/permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  // @ApiBearerAuth()
  // @Permissions(Permission.CREAR_PERMISO)
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  findAll() {
    return this.permissionService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id);
  }

  // @ApiBearerAuth()
  // @Permissions(Permission.EDITAR_PERMISO)
  @Put('/:id')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  // @ApiBearerAuth()
  // @Permissions(Permission.ELIMINAR_PERMISO)
  @Delete('/:id')
  async remove(@Param('id') id: string) {
    await this.permissionService.remove(id);
    return 'permiso eliminado correctamente'
  }
}
