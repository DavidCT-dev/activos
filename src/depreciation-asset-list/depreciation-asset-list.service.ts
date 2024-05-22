import { HttpException, Injectable } from '@nestjs/common';
import { CreateDepreciationAssetListDto } from './dto/create-depreciation-asset-list.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DepreciationAssetList, DepreciationAssetListDocument } from './schema/depreciation-asset';
import { FilterQuery, Model } from 'mongoose';
import { FilterAssetDto } from 'src/asset/dto/filter.asset.dto';
import { FilterDepreciationDto } from './dto/filter-depreciation.dto';

@Injectable()
export class DepreciationAssetListService {

  constructor(
    @InjectModel(DepreciationAssetList.name) private depreciationAssetListModel: Model<DepreciationAssetListDocument>, 
  ){}

  async setDataDefault() {
    const count = await this.depreciationAssetListModel.estimatedDocumentCount();
    if (count > 0) return;
    const values = await Promise.all([
      this.depreciationAssetListModel.create({ assetCategory: 'EDIFICACIONES', usefulLife:40 }),

      this.depreciationAssetListModel.create({ assetCategory: 'MUEBLES Y ENSERES DE OFICINA', usefulLife:10}),

      this.depreciationAssetListModel.create({ assetCategory: 'MAQUINARIA EN GENERAL', usefulLife:8}),

      this.depreciationAssetListModel.create({ assetCategory: 'EQUIPOS E INSTALACIONES', usefulLife:8,}),

      this.depreciationAssetListModel.create({ assetCategory: 'BARCOS Y LANCHAS EN GENERAL', usefulLife:10 }),
      
      this.depreciationAssetListModel.create({ assetCategory: 'VEHICULOS AUTOMOTORES', usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'AVIONES', usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'MAQUINARIA PARA LA CONSTRUCCION', usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'MAQUINARIA AGRICOLA', usefulLife:4 }),

      this.depreciationAssetListModel.create({ assetCategory: 'ANIMALES DE TRABAJO', usefulLife:4 }),

      this.depreciationAssetListModel.create({ assetCategory: 'HERRAMIENTAS EN GENERAL', usefulLife:4 }),


      this.depreciationAssetListModel.create({ assetCategory: 'REPRODUCTORES Y HEMBRAS DE PEDIGREE O PUROS POR CRUZA', usefulLife:8 }),

      this.depreciationAssetListModel.create({ assetCategory: 'EQUIPOS DE COMPUTACION', usefulLife:4 }),

      this.depreciationAssetListModel.create({ assetCategory: 'CANALES DE REGADÍO Y POZOS', usefulLife:20 }),


      this.depreciationAssetListModel.create({ assetCategory: 'ESTANQUES, BAÑADEROS Y ABREVADEROS', usefulLife:10 }),

      this.depreciationAssetListModel.create({ assetCategory: 'ESTANQUES, BAÑADEROS Y ABREVADEROS', usefulLife:10 }),

      this.depreciationAssetListModel.create({ assetCategory: 'VIVIENDAS PARA EL PERSONAL', usefulLife:20 }),

      this.depreciationAssetListModel.create({ assetCategory: 'MUEBLES Y ENSERES EN LAS VIVIENDAS PARA EL PERSONAL', usefulLife:10 }),

      this.depreciationAssetListModel.create({ assetCategory: 'SILOS, ALMACENES Y GALPONES', usefulLife:20 }),
      
      this.depreciationAssetListModel.create({ assetCategory: 'TINGLADOS Y COBERTIZOS DE MADERA', usefulLife:5 }),
      
      this.depreciationAssetListModel.create({ assetCategory: 'INSTALACIONES DE ELECTRIFICACION Y TELEFONIA RURALES', usefulLife:10 }),

      this.depreciationAssetListModel.create({ assetCategory: 'CAMINOS INTERIORES', usefulLife:10 }),

      this.depreciationAssetListModel.create({ assetCategory: 'CAÑA DE AZUCAR', usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'VIDES', usefulLife:8 }),
      
      this.depreciationAssetListModel.create({ assetCategory: 'FRUTALES', usefulLife:10 }),
      
      this.depreciationAssetListModel.create({ assetCategory: 'POZOS PETROLEROS', usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'LÍNEAS DE RECOLECCIÓN DE LA INDUSTRIA PETROLERA',  usefulLife:5 }),

      this.depreciationAssetListModel.create({ assetCategory: 'EQUIPOS DE CAMPO CIÉ LA INDUSTRIA PETROLERA', usefulLife:8 }),

      this.depreciationAssetListModel.create({ assetCategory: 'PLANTAS DE PROCESAMIENTO DE LA INDUSTRIA PETROLERA', usefulLife:8 }),

      this.depreciationAssetListModel.create({ assetCategory: 'DUCTOS DE LA INDUSTRIA PETROLERA', usefulLife:10 }),

    ]);

    return values;
  }

  async create(createDepreciationAssetListDto: CreateDepreciationAssetListDto) {
  
    const similarCategory = await this.depreciationAssetListModel.findOne({
      assetCategory: new RegExp(createDepreciationAssetListDto.assetCategory, 'i'),
    });
    if (similarCategory) {
      throw new HttpException('Ya existe una categoría similar o idéntica.',409);
    }
    return await this.depreciationAssetListModel.create(createDepreciationAssetListDto);
  }

  async findAll(params?: FilterDepreciationDto) {
    const filters: FilterQuery<DepreciationAssetList> = { 
      isDeleted: false,
    };
    const { page,limit=10,assetCategory} = params;
    if (params) {
      if (assetCategory) {
        filters.assetCategory= {
          $regex: `^.{2}${assetCategory.substring(2)}.*`,
          $options: 'i',
        };
      }
    }
    if (limit<=0){
      throw new HttpException(
        'El valor de la cantidad de paginas no es válido. Debe ser mayor que 0.',
        400,
      );
    }
    if (page<=0){
      throw new HttpException(
        'El valor de la página no es válido. Debe ser mayor que 0.',
        400,
      );
    }
    const pageSize= limit ;
    const countQuery= this.depreciationAssetListModel.find(filters)
    const totalGrupo = await  this.depreciationAssetListModel.countDocuments({
      isDeleted:false
    });
    const totalGrupos= await countQuery.countDocuments()
    const totalPages=Math.ceil(totalGrupos/pageSize)
    const skip=(page - 1)*pageSize || 0;
    const [depreciationAsset] = await Promise.all([
      this.depreciationAssetListModel
        .find(filters)
        .sort({ _id: -1 })
        .limit(pageSize)
        .skip(skip)
        .exec(),
    ])
    return {totalGrupo,totalPages,depreciationAsset}
    // if(depreciationAsset.length >0 ){
    //   return {totalGrupo,totalPages,depreciationAsset}
    // } else {
    //   return { message: 'No se encontraron grupos de activos que coincidan con la búsqueda.' };
    // }
  }

  async findOne(id: string) {
    const asset = await this.depreciationAssetListModel.findOne({ _id: id});
    return asset;
  }

  async update(id: string, updateDepreciationAssetListDto: CreateDepreciationAssetListDto) {
    return await this.depreciationAssetListModel.findByIdAndUpdate(id,updateDepreciationAssetListDto,{new:true});
  }

  async darDeBaja(_id: string) {
    const asset = await this.depreciationAssetListModel.findByIdAndUpdate({ _id });
    if (!asset) {
      throw new HttpException('activo no encontrado', 404);
    }
    asset.isDeleted = true;   
    return asset.save();
  }

  async updateEstado(activoId: string, estado: string): Promise<void> {
    await this.depreciationAssetListModel.findOneAndUpdate({ _id: activoId }, { estado });
  }
 
}
