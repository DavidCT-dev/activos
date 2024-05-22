import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Res, HttpStatus, UseInterceptors, Query, Req } from '@nestjs/common';
import { DepreciationAssetListService } from './depreciation-asset-list.service';
import { CreateDepreciationAssetListDto } from './dto/create-depreciation-asset-list.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../guard/decorators/permissions.decorator'
import { Permission } from 'src/guard/constants/permission';
import { RolesGuard } from 'src/guard/roles.guard';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
// import { CreateSubCategoryDto } from './dto/sub-category.dto';
import { FilterAssetDto } from 'src/asset/dto/filter.asset.dto';
import { FilterDepreciationDto } from './dto/filter-depreciation.dto';
import { Request } from 'express';

@ApiTags('accounting-groups')
@ApiBearerAuth()
// @UseGuards(RolesGuard)

@Controller('/depreciation-asset-list')
export class DepreciationAssetListController {
  constructor(private readonly depreciationAssetListService: DepreciationAssetListService) {}
 
  @Permissions(Permission.ACTIVO_CREAR_GRUPO_CONTABLE_ACT)
  @UseInterceptors(LoggerInterceptor)
  @Post()
  
  async create(@Body() createDepreciationAssetListDto: CreateDepreciationAssetListDto) {
    return await this.depreciationAssetListService.create(createDepreciationAssetListDto);
  }

  @ApiQuery({ name: 'page', description: 'ingrese el nuemero de pagina', required: false }) 
  @ApiQuery({ name: 'limit', description: 'ingrese la cantidad de activos a visualizar', required: false})
  @ApiQuery({ name: 'assetCategory', description: 'ingrese la categoria de activos a visualizar', required: false})
  @Get()
  async findAll(@Query() params?:FilterDepreciationDto) {
    const data= await this.depreciationAssetListService.findAll(params);
    return data
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
   
    return await this.depreciationAssetListService.findOne(id);
  }

  // @Permissions(Permission.ACTIVO_EDITAR_GRUPO_CONTABLE_ACT)
  @UseInterceptors(LoggerInterceptor)
  @Put('/:id')
  async update(@Param('id') id: string, @Body() updateDepreciationAssetListDto:CreateDepreciationAssetListDto) {
    return await this.depreciationAssetListService.update(id, updateDepreciationAssetListDto);
  }
  
  // @Permissions(Permission.ACTIVO_ELIMINAR_GRUPO_CONTABLE_ACT)
  @UseInterceptors(LoggerInterceptor)
  @Delete('/:id')
  async darDeBaja(@Param('id') id: string) {
    return await this.depreciationAssetListService.darDeBaja(id);
  }

  // @UseInterceptors(LoggerInterceptor)
  // @Delete('/:id')
  // async darDeBaja(@Param('id') id: string, @Res() res: any) {
  //   return await this.depreciationAssetListService.darDeBaja(id);
  // }
}
