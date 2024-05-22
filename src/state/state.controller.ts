import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Put, Query, Req, UseInterceptors, UseGuards } from '@nestjs/common';
import { StateService } from './state.service';
import { CreateStateDto } from './dto/create-state.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FilterStateDto } from './dto/filter.statedto';
import {Request} from 'express'
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
import { UpdateAssetDto } from 'src/asset/dto/update-asset.dto';
import { Permissions } from '../guard/decorators/permissions.decorator'
import { Permission } from 'src/guard/constants/permission';
import { RolesGuard } from 'src/guard/roles.guard';

@ApiTags('state')
@ApiBearerAuth()
@Controller('state')
export class StateController {
  constructor(private readonly stateService: StateService) {}
  
  @Permissions(Permission.ACTIVO_CREAR_ESTADO_ACT)
  @UseInterceptors(LoggerInterceptor) 
  @Post()
  create(@Req() req :Request,@Body() createStateDto: CreateStateDto) {
    createStateDto.idUser = req.user.toString()
    return this.stateService.create(createStateDto);
  }
  @ApiQuery({ name: 'nameState', description: 'ingrese el nombre por el cual desea filtrar el estado', required: false})
  @ApiQuery({ name: 'page', description: 'ingrese el nuemero de pagina', required: false }) 
  @ApiQuery({ name: 'limit', description: 'ingrese la cantidad de activos a visualizar', required: false})
  
  @Permissions(Permission.ACTIVO_OBTENER_ESTADO_ACT)
  @Get()
  async findAll(@Req() req :Request,@Query() params?:FilterStateDto) {
    const user =req.user
     const data=await this.stateService.findAll(user,params);
    return data
    }

  
  @Get(':id')
  async findOne(@Param('id') id: string) {
      try {
        return await this.stateService.findOne(id);
      } catch (error) {
        if(error instanceof HttpException){
          throw error
        }
      }
  }
  
  @Permissions(Permission.ACTIVO_OBTENER_ESTADO_ACT)
  @UseInterceptors(LoggerInterceptor)
  @Delete(':id')
  async remove(@Param('id') id: string,) {
    return await this.stateService.remove(id);
  }

  @Permissions(Permission.ACTIVO_EDITAR_ESTADO_ACT)
  @UseInterceptors(LoggerInterceptor)
  @Put('update/:id')
  async update(@Param('id') id: string, @Body() updateStateDto: CreateStateDto) {
    return await this.stateService.update(id, updateStateDto);
  }

  @Permissions(Permission.ACTIVO_REESTABLECER_ESTADO_ACT)
  @Put('restart-state/:id')
  async restartState(@Param('id') id: string) {
     return await this.stateService.restartState(id);
  }
}
