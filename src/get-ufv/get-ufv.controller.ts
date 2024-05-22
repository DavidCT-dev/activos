import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, UseGuards, UseInterceptors, Req, Query } from '@nestjs/common';
import { GetUfvService } from './get-ufv.service';
import { CreateGetUfvDto } from './dto/create-get-ufv.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CustomErrorService } from 'src/error.service';
import { RolesGuard } from 'src/guard/roles.guard';
import { Permissions } from '../guard/decorators/permissions.decorator'
import { Permission } from 'src/guard/constants/permission';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
import { FindUfvDto } from './dto/find-ufv.dto';
import { Request } from 'express';
import { FilterUfvDto } from './dto/filter.ufv.dto';

@ApiTags('get-ufv-from-bcb')
@ApiBearerAuth()
// @UseGuards(RolesGuard)
@Controller('get-ufv')
export class GetUfvController {
  constructor(
    private readonly getUfvService: GetUfvService,
    private customErrorService:CustomErrorService
    ) {}

  @Permissions(Permission.ACTIVO_OBTENER_UFVS_DEL_BCB_ACT)
  @UseInterceptors(LoggerInterceptor)
  @Post()
  async create(@Body() createGetUfvDto: CreateGetUfvDto) {
    const data = await this.getUfvService.getUfvFromBcb(createGetUfvDto);
    
    if(data.length==0){
      return {message:'la ufv que solicita ya esta guardada'}
    }
    return data
  }

  @Permissions(Permission.ACTIVO_OBTENER_UFVS_ACT)
  
  @ApiQuery({ name: 'page', description: 'ingrese el nuemero de pagina', required: false }) 
  @ApiQuery({ name: 'limit', description: 'ingrese la cantidad de activos a visualizar', required: false})
  
  @Get()
  async findAll(@Query() params?:FilterUfvDto) {
    return await this.getUfvService.findAll(params);
  }

  @Post('/find-ufv-current')
  findDateId(@Body() findUfvDto: FindUfvDto) {
    return this.getUfvService.findDate(findUfvDto);
  }

}
