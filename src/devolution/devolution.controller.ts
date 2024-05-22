import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Req, UseInterceptors, HttpException, Query } from '@nestjs/common';
import { DevolutionService } from './devolution.service';
import { CreateDevolutionDto } from './dto/create-devolution.dto';
import { UpdateDevolutionDto } from './dto/update-devolution.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
import { FilterAssetDto } from 'src/asset/dto/filter.asset.dto';
import { LoggerAssetInterceptors } from 'src/interceptors/loggerAssetInterceptors';

@ApiBearerAuth()
@ApiTags('devolution')
@Controller('devolution')
export class DevolutionController {
  constructor(private readonly devolutionService: DevolutionService) {}

  @UseInterceptors(LoggerAssetInterceptors)
  @UseInterceptors(LoggerInterceptor)
  @Post()
  async create(@Body() createDevolutionDto: CreateDevolutionDto, @Req() req:Request) {    
    createDevolutionDto.idUser = req.user.toString()
    return await this.devolutionService.create(createDevolutionDto);
  }

  @ApiQuery({ name: 'page', description: 'Ingrese el número de página', required: false }) 
  @ApiQuery({ name: 'limit', description: 'Ingrese la cantidad de activos a visualizar', required: false })
  
  @ApiQuery({ name: 'location', description: 'Ingrese la ubicación del activo', required: false })
  @ApiQuery({ name: 'receiverId', description: 'Ingrese al personal que recibió el activo', required: false })
  @ApiQuery({ name: 'transmitterId', description: 'Ingrese al personal que entregó el activo', required: false })
  
  
  @Get()
  async findAll(@Req() req:Request,@Query() params?:FilterAssetDto) {
    const user =req.user
    return await this.devolutionService.findAll(user,params);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    
    return await this.devolutionService.findOne(id);
  }
  @Get('/get-asset-from-personal/:id')
  async getAssetPersonal(@Param('id') id: string){
    return await this.devolutionService.AssetFromPersonal(id);
  }

  @UseInterceptors(LoggerAssetInterceptors)
  @UseInterceptors(LoggerInterceptor)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDevolutionDto: UpdateDevolutionDto) {
    return await this.devolutionService.update(id, updateDevolutionDto);
  }

  @UseInterceptors(LoggerAssetInterceptors)
  @UseInterceptors(LoggerInterceptor)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.devolutionService.remove(id);
  }
  @Get('/get-asset-document-pdf/:id')
  async DocumentsPdf(@Param('id') id: string) {
    try {
      return await this.devolutionService.documentsPdf(id);
       
    } catch (error) {
      if(error instanceof HttpException){
        throw error
      }
      throw new HttpException('Error generando el pdf',404);
    }
  }
}
