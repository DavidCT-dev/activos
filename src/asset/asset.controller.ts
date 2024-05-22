import { Controller, Get, Post, Body, Patch, Param, Delete,  UseInterceptors, UploadedFile, Put,  Req, Query, HttpException, UseGuards } from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { CustomErrorService } from 'src/error.service';
import { FilterAssetDto } from './dto/filter.asset.dto';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
import { LoggerAssetInterceptors } from 'src/interceptors/loggerAssetInterceptors';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { ReadCodeQRDto } from './dto/read-QR.dto';
import { Permissions } from '../guard/decorators/permissions.decorator'
import { Permission } from 'src/guard/constants/permission';
import { CreateQRDto } from './dto/create-QR.dto';
import { RolesGuard } from 'src/guard/roles.guard';

// import { InsertAssets } from './insertAsset';

@ApiBearerAuth()
@ApiTags('asset') 
@UseGuards(RolesGuard)
@Controller('/asset')
export class AssetController {
  constructor(
    private readonly assetService: AssetService,
    private httpService:HttpService,
    private customErrorService:CustomErrorService,
    // private readonly insertAsset: InsertAssets,
    ) {}
    
  @Permissions(Permission.ACTIVO_CREAR_ACTIVO_ACT)
  @UseInterceptors(LoggerAssetInterceptors)
  @UseInterceptors(LoggerInterceptor)
  @Post()
  async create(@Req() req :Request,@Body() createAssetDto: CreateAssetDto ) {
    createAssetDto.idUser = req.user.toString()
    const { lote } = createAssetDto.informationCountable
    const assets = [];
    for (let i = 0; i < lote; i++) {
      assets.push( createAssetDto );
    }
    return await this.assetService.create(createAssetDto, assets);
  }

  
  @ApiQuery({ name: 'nameAsset', description: 'ingrese el nombre por el cual desea filtrar el activo', required: false })
  @ApiQuery({ name: 'state', description: 'ingrese estado del activo', required: false }) 
  @ApiQuery({ name: 'responsible', description: 'Ingrese responsable del activo', required: false })
  @ApiQuery({ name: 'location', description: 'ingrese ubicacion la activo', required: false })
  @ApiQuery({ name: 'code', description: 'ingrese el codigo del activo', required: false })
  @ApiQuery({ name: 'typeCategoryAsset', description: 'ingrese la locacion del activo', required: false })

  @ApiQuery({ name: 'page', description: 'ingrese el nuemero de pagina', required: false }) 
  @ApiQuery({ name: 'limit', description: 'ingrese la cantidad de activos a visualizar', required: false})
  
  @Permissions(Permission.ACTIVO_OBTENER_ACTIVOS_ACT)
  @Get()
  async findAll(@Req() req :Request , @Query() params?:FilterAssetDto) {
   
    const user =req.user
    const data = await this.assetService.findAll(user, params );
    return data
  }

  @Get('/:id')  
  async findOne(@Param('id') id: string) {
    return await this.assetService.findOne( id);
  }
  
  @Permissions(Permission.ACTIVO_EDITAR_ACTIVO_ACT)
  @UseInterceptors(LoggerAssetInterceptors)
  @UseInterceptors(LoggerInterceptor)
  @Put('/batch-update')
    async update(@Body( ) batchUpdateDto: UpdateAssetDto) {
        const { assetIds } = batchUpdateDto
       
    return await this.assetService.update(//user,
    assetIds, batchUpdateDto);
  }

  @Permissions(Permission.ACTIVO_ELIMINAR_ACTIVO_ACT) 
  @UseInterceptors(LoggerAssetInterceptors)
  @UseInterceptors(LoggerInterceptor)
  @Delete('/:id')
  async darDeBaja(@Param('id') id: string) {
     const data = await this.assetService.darDeBaja(id);
     return [data]
  } 
  
  @Post('/get-asset-QR')
  async GetDataQr(@Body() objectCode: ReadCodeQRDto) {  
    return await this.assetService.getDataQr(objectCode.code);
  }

  // @Permissions(Permission.ACTIVO_VER_QR)
  @Post('/get-asset-generate-QR/')
  async generateQRCode(@Body() objectCode: CreateQRDto) {
    const results = [];
    const {QR}=objectCode
    for (const code of QR) {
      const result = await this.assetService.generateQRCodeBase64(code);
      results.push(result);
    }
    return results;
  }

  // @Permissions(Permission.ACTIVO_VER_PDF)
  @Get('/get-asset-document-pdf/:id')
  async DocumentsPdf(@Param('id') id: string) {
    try {

      return await this.assetService.documentsPdf(id);
       
    } catch (error) {
      if(error instanceof HttpException){
        throw error
      }
      throw new HttpException('Error generando el pdf',404);
    }
  }

  @Post('/get-asset-imagen/:id')
  async base64Imagen(@Param('id') id: string) {
    return await this.assetService.base64Imagen(id);
  }
}

