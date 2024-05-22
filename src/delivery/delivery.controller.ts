import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Req, Res, Query, UseInterceptors, HttpException } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'Express'
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { FilterDeliveryDto } from './dto/filter.delivery.dto';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
import { ReadCodeQRDto } from './dto/read-QR.dto';
import { LoggerAssetInterceptors } from 'src/interceptors/loggerAssetInterceptors';


@ApiTags('delivery')
@ApiBearerAuth()
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @UseInterceptors(LoggerAssetInterceptors)
  @UseInterceptors(LoggerInterceptor)
  @Post()
  async create(@Body() createDeliveryDto: CreateDeliveryDto,@Req() req :Request) {
    createDeliveryDto.idUser = req.user.toString()
    return await this.deliveryService.create(createDeliveryDto);
  }
  @ApiQuery({ name: 'page', description: 'Ingrese el número de página', required: false }) 
  @ApiQuery({ name: 'limit', description: 'Ingrese la cantidad de activos a visualizar', required: false })

  @ApiQuery({ name: 'location', description: 'Ingrese la ubicación del activo', required: false })
  @ApiQuery({ name: 'receiverId', description: 'Ingrese al personal que recibió el activo', required: false })
  @ApiQuery({ name: 'transmitterId', description: 'Ingrese al personal que entregó el activo', required: false })

 
  @Get()
  async findAll(@Req() req :Request ,@Query() params?:FilterDeliveryDto) {
    const user =req.user
    const data = await this.deliveryService.findAll(user, params);
    return data
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    return await this.deliveryService.findOne(id);
  }
@Get('/get-asset-from-personal/:id')
  async getAssetPersonal(@Param('id') id: string){
    
    return await this.deliveryService.AssetFromPersonal(id);
  }
  @UseInterceptors(LoggerAssetInterceptors)
  @UseInterceptors(LoggerInterceptor)
  @Put('/:id')
  async update(@Param('id') id: string, @Body() updateDeliveryDto: UpdateDeliveryDto, @Req() req:Request) {
    return await this.deliveryService.update(id, updateDeliveryDto);
  }
  @UseInterceptors(LoggerAssetInterceptors)
  @UseInterceptors(LoggerInterceptor)
  @Delete('/:id')
  async darDeBaja(@Param('id') id: string) {
    
    return await this.deliveryService.darDeBaja(id);
  }
  
  @Post('/get-data-qr')
  async GetDataQr(@Body() objectCode: ReadCodeQRDto) {
    return await this.deliveryService.getDataQr(  objectCode.code);
  }
  @Get('/get-asset-generate-QR/:id')
  async generateQRCode(@Param('id') id: string) {
    try {
     return await this.deliveryService.generateQRCodeBase64(id);
      
    } catch (error) {
      if(error instanceof HttpException){
        throw error
      }
      throw new HttpException('Error generando el código QR',404);
    }
  }
  @Get('/get-asset-document-pdf/:id')
  async DocumentsPdf(@Param('id') id: string) {
    try {
      return await this.deliveryService.documentsPdf(id);
       
    } catch (error) {
      if(error instanceof HttpException){
        throw error
      }
      throw new HttpException('Error generando el pdf',404);
    }
  }

}
