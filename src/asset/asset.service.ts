import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Asset, AssetDocument } from './schema/asset.schema';
import mongoose, { Model } from 'mongoose';
import {DepreciationAssetList, DepreciationAssetListDocument} from 'src/depreciation-asset-list/schema/depreciation-asset';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration';
import { DepreciationService } from './depreciation.service';
import {  Supplier,  SupplierDocument,} from 'src/supplier/schema/supplier.schema';
import { Ufv, UfvDocument } from '../get-ufv/schema/ufvs.schema';
import { GetUfvService } from 'src/get-ufv/get-ufv.service';
import { CustomErrorService } from 'src/error.service';
import { DocumentPdf } from './asset.documentPdf.service';
import { FilterAssetDto } from './dto/filter.asset.dto';
import { FilterQuery } from 'mongoose';
import { State, StateDocument } from 'src/state/schema/state.schema';
import { UpdateAssetDto } from './dto/update-asset.dto';
import * as QRCode from 'qrcode';
import * as crypto from'crypto';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { Devolution, DevolutionDocument } from 'src/devolution/schema/devolution.schema';
import { Delivery, DeliveryDocument } from 'src/delivery/schema/delivery.schema';
import { promises } from 'dns';
import { randomInt } from "crypto";
import {faker} from '@faker-js/faker'
import { OrganigramaModule } from 'src/organigrama/organigrama.module';
interface States {
  _id: string;
  name: string;
  isDeleted: boolean;
}
interface Suppliers {
  _id: string;
  managerName: string;
  managerCi: string;
}
interface Locations {
  _id: string;
  name: string;
}
@Injectable()
export class AssetService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(Devolution.name) private devolutionModel: Model<DevolutionDocument>,
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
    @InjectModel(State.name) private stateModel: Model<StateDocument>,
  // @InjectModel(Organigrama.name) private OrganigramaModel: Model<StateDocument>,

    @InjectModel(DepreciationAssetList.name)
    private depreciationAssetListModel: Model<DepreciationAssetListDocument>,
    @InjectModel(Ufv.name) private ufvmodel: Model<UfvDocument>,
    private httpService: HttpService,
    private depreciationService: DepreciationService,
    private ufvService: GetUfvService,
    private customErrorService: CustomErrorService,
    private documentPdf: DocumentPdf,
  ) {}

  async create(objectAsset: CreateAssetDto, assets: any[]) {
    const { supplier, location, file, informationCountable, state } = objectAsset;
    const { price, dateAcquisition } = informationCountable;
    const findSupplier = await this.supplierModel.findOne({ _id: supplier });
    if (!findSupplier) {
      this.customErrorService.customResponse(
        HttpStatus.NOT_FOUND,
        true,
        'proveedor no encontrado',
        'no se encontro al proveedor que intento registrar',
      );
    }
    const depresiationInitial = await this.calculateDepreciationInitial(objectAsset,);
    let assetDepresiation =await this.depreciationService.calculateAndStoreDepreciation(depresiationInitial,);


    const findUfv = await this.ufvmodel.findOne({ fecha: dateAcquisition });
    if (!findUfv) {
      this.customErrorService.customResponse(
        HttpStatus.NOT_FOUND,
        true,
        'ufv no encontrada',
        'no se puedo encontrar la ufv inicial',
      );
    }
    //const ufvCurrent = await this.ufvService.ExtractUfvCurrent();
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    const ufvCurrent = await this.ufvmodel.findOne({ fecha: formattedDate });
    if (!ufvCurrent) {
      this.customErrorService.customResponse(
        HttpStatus.NOT_FOUND,
        true,
        'ufv no encontrada',
        'no se puedo encontrar la ufv para la de fecha actual',
      );
    }
    assetDepresiation.ufv3 = (
      price * (ufvCurrent.ufv / findUfv.ufv) -
      price
    ).toFixed(2);
    
    assetDepresiation.ufv4 = (
      price * (ufvCurrent.ufv / findUfv.ufv) -
      price +
      price
    ).toFixed(2);
    assetDepresiation.informationCountable.code = await this.generateUniqueCode(objectAsset);

    if (file && file != '' && file != 'string') {
      const mimeType = file.split(';')[0].split(':')[1].split('/')[1];
      const base64 = file.split(',')[1];
      const fileObj = { mime: mimeType, base64: base64 };
      try {
        const res = await this.httpService
          .post(`${getConfig().file_upload}files/upload`, { file: fileObj })
          .toPromise();

        assetDepresiation = { ...assetDepresiation, file: res.data.file._id };
      } catch (error) {
        throw error.response?.data;
      }
    }
    const assetDepresiationNew = await new this.assetModel(assetDepresiation) 
    assetDepresiationNew.responsible = assetDepresiationNew.responsible
    // console.log({assetDepresiation})
    // console.log({assetDepresiationNew})
    // console.log({findSupplier})
    // const htmlContent = await this.documentPdf.htmlContent(
    //   assetDepresiation,
    //   assetDepresiationNew.responsible,
    //   findSupplier,
    // );

    let locationData
    try {
      const res = await this.httpService
        .get(`${getConfig().api_organigrama}departments/${location}`)
        .toPromise();
      locationData = res.data
      assetDepresiation.location = res.data._id;
    } catch (error) {
      throw error.response?.data;
    }

    const findState = await this.stateModel.findOne({ _id: state });
    if (!findState) {
      this.customErrorService.customResponse(
        HttpStatus.NOT_FOUND,
        true,
        'estado no encontrado',
        'el estado que ingreso no se logro encontrar',
      );
    }

    // let responseIdPdf
    // try {
    //   responseIdPdf = await this.httpService
    //     .post(`${getConfig().api_pdf}convert`, { textPlain: htmlContent })
    //     .toPromise();    
    // } catch (error) {
    //   throw error.response?.data;
    // }


    assetDepresiation.state = findState._id;
    const codesArray = assetDepresiation.informationCountable.code;
    for (let i = 0; i < assets.length; i++) {
      const assetDepresiationCopy = JSON.parse(JSON.stringify(assetDepresiation));
      assetDepresiationCopy.informationCountable.code = codesArray[i];
      assets[i] = assetDepresiationCopy;

      // assets[i].informationCountable.documentPdf = new mongoose.Types.ObjectId(responseIdPdf.data._id);
    }

    const assetNews = await this.assetModel.insertMany(assets);
    await this.assetModel.populate(assetNews, [
      { path: 'supplier' },
      { path: 'typeCategoryAsset' },
      { path: 'state' },
      
    ]);
    const assetNewsCopy = JSON.parse(JSON.stringify(assetNews));
    for(const asset of assetNewsCopy) {
      asset.responsible = assetDepresiationNew.responsible;
      asset.location = locationData
      asset.informationCountable.documentPdf=""
    }
    return assetNewsCopy
  }


  async generateUniqueCode(objectAsset: CreateAssetDto) {
    const AssetLote = objectAsset.informationCountable.lote;
    
    if (AssetLote >= 1) {
      const year = new Date().getFullYear();
      const lastAssetOfYear = await this.assetModel.findOne({idUser:objectAsset.idUser}).sort({ _id: -1 }).lean().exec();

      let count = 1;
      if (lastAssetOfYear) {
        const lastCodeArray = lastAssetOfYear.informationCountable
          .code as unknown as string[];

        const parts = lastCodeArray.toString().split('_');
        const yearCode = parts[1];

        const lastCode = lastCodeArray
          .toString()
          .substring(lastCodeArray.lastIndexOf('A') + 1);

        if (parseInt(yearCode) != year) {
          count = 1;
        } else {
          count = parseInt(lastCode) + 1;
        }
      }

      const codes = [];
      for (let i = 0; i < AssetLote; i++) {
        const code = `INV_${year}_A${count}`;
        codes.push(code);
        count++;
      }
      return codes;
    } else {
      throw new HttpException(
        'No se creó el activo debido a que el valor del campo "lote" no es mayor o igual a 1.',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async findAll(user,params?: FilterAssetDto) {
    
    const filters: FilterQuery<Asset> = { isDeleted: false, idUser:user};
    const { page,limit =10, nameAsset, state,location,code, responsible,typeCategoryAsset } = params;

    if (params) {
      if (nameAsset) {
        filters.name = {
          $regex: `^.{3}${nameAsset.substring(3)}.*`,
          $options: 'i',
        };
      }
      if (state) {
        const findState = await this.stateModel.findOne({ name: new RegExp(state.toString(), 'i') });
        if(findState){
          filters.state = {
            $regex: `^.{3}${findState._id.toString().substring(3)}.*`,
            $options: 'i',
          };
        }else{
          return[]
        }
      }
      if (typeCategoryAsset) {
        const findTypeCategory = await this.depreciationAssetListModel.findOne({
          assetCategory: new RegExp(typeCategoryAsset.toString(), 'i'),
        });
          filters.typeCategoryAsset = {
            $regex: `^.{3}${findTypeCategory._id.toString().substring(3)}.*`,
              $options: 'i',
            };
            
      }
     
      if (responsible) {
        console.log(responsible)
        const res= await this.httpService.get(`${getConfig().api_personal}api/personal/filtered?fullName=${responsible}`).toPromise();
        console.log(res)
        const idsPerson = res.data.data.map(index=> index._id)
        if(idsPerson.length>0){
          for(const id of idsPerson){
            filters.responsible = {
              $regex: id.toString(),
              $options: 'i',
            };
          }
        }else{
          return[]
        }            
      }
      if (location) {
      
      const organigrama = await this.httpService.get(`${getConfig().api_organigrama}departments/departments/`).toPromise();
      const findLocation = organigrama.data.find(item => new RegExp(location, 'i').test(item.name));
          if(findLocation){
            filters.location = {
              $regex: findLocation._id.toString(),
              $options: 'i',
            };
          }
          else{
            return []
          }
      }
      if(code){
      filters['informationCountable.code'] = {
          $regex: `^.{3}${code.substring(3)}.*`,
          $options: 'i',
        };
      }
    }
    
    const pageSize= limit  ;
    const countQuery= this.assetModel.find(filters)
    const totalAsset = await  this.assetModel.countDocuments({idUser:user,isDeleted:false});
    
    const totalAssets= await countQuery.countDocuments()
    
    const totalPages=Math.ceil(totalAssets/pageSize)
    
    const skip=(page - 1)*pageSize || 0;
    const [assets] = await Promise.all([
      this.assetModel
        .find(filters)
        .sort({ _id: -1 })
        .limit(pageSize)
        .skip(skip)
        .populate('supplier')
        .populate('typeCategoryAsset')
        .populate('state')
        .exec(),
    ]);

    const count = await this.assetModel.estimatedDocumentCount();

    if (count < 0) {
      return assets;
    }
    for (const asset of assets) {
      if(mongoose.Types.ObjectId.isValid(asset.responsible)){
        try {
          const res = await this.httpService.get(`${getConfig().api_personal}api/personal/${asset.responsible}`).toPromise()
          asset.responsible=`${res.data.name} ${res.data.lastName}`

        } catch (error) {
          throw error.response?.data;
        }
      }
      
      asset.informationCountable.documentPdf=''
      try {
        const res = await this.httpService
          .get(`${getConfig().api_organigrama}departments/${asset.location}`).toPromise();
        asset.location = res.data;
      } catch (error) {
        throw error.response?.data;
      }
      
    }
    return {
      totalAsset,
      totalPages,
      assets
    };
  }

  async getDataQr(code :string){

    const secretKey = 'tu_clave_secreta';
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
      let decryptedData = decipher.update(code, 'hex', 'utf8');
      decryptedData += decipher.final('utf8');
      return decryptedData;
    } catch (error) {
      return code
    }
  }

  async findOne(id: string) {
    const filters: FilterQuery<Asset> = { isDeleted: false };
    const asset = await this.assetModel
      .findById(id)
      .populate('typeCategoryAsset')
      .populate('supplier')
      .populate('state');


    if (!asset) {
      this.customErrorService.customResponse(
        HttpStatus.NOT_FOUND,
        true,
        'activo no encontrado',
        'el activo que solicita no se puedo encontrar',
      );
    }

    if(asset.responsible && mongoose.Types.ObjectId.isValid(asset.responsible)){
      try {
        const res = await this.httpService.get(`${getConfig().api_personal}api/personal/${asset.responsible}`).toPromise()
        asset.responsible=`${res.data.name} ${res.data.lastName}`

      } catch (error) {
        throw error.response?.data;
      }
    }

    try {
      const res = await this.httpService
        .get(`${getConfig().api_organigrama}departments/${asset.location}`)
        .toPromise();
      asset.location = res.data;
    } catch (error) {
      throw error.response?.data;
    }

    return asset;
  }
  
  async update(assetIds: string[], updateAssetDto: UpdateAssetDto) {
    let assetExists = 1;
    for (const _id of assetIds) {
      const findAsset = await this.assetModel.findOne({_id,isDeleted: false});
      if (!findAsset) {
        this.customErrorService.customResponse(
          HttpStatus.NOT_FOUND,
          true,
          'activo no encontrado',
          `el activo N° ${assetExists} que solicita no se puedo encontrar`,
        );
      }
      assetExists++;
    }

    const { typeCategoryAsset, file: fileCopy } = updateAssetDto
    
    for (const id of assetIds) {

      updateAssetDto.typeCategoryAsset = typeCategoryAsset
      updateAssetDto.file = fileCopy
      
      const findAsset = await this.assetModel.findOne({_id: id});

  
      const { state } = updateAssetDto;
      const { dateAcquisition, price } = updateAssetDto.informationCountable;
      const { file } = updateAssetDto;

      if (file && file.startsWith('data')) {
        const mimeType = file.split(';')[0].split(':')[1].split('/')[1];
        const base64 = file.split(',')[1];
        const fileObj = {
          mime: mimeType,
          base64: base64,
        };
        if (findAsset.file) {
          try {
            const res = await this.httpService
              .post(`${getConfig().file_upload}file/update/${findAsset.file}`, {
                file: fileObj,
              })
              .toPromise();
            updateAssetDto = {...updateAssetDto, file: res.data.updatedFile._id,
            };
          } catch (error) {
            throw error.response?.data;
          }
        } else {
          try {
            const res = await this.httpService
              .post(`${getConfig().file_upload}files/upload`, { file: fileObj })
              .toPromise();
            updateAssetDto = { ...updateAssetDto, file: res.data.file._id };
          } catch (error) {        
            throw error.response?.data;
          }
        }
      } else {
        updateAssetDto.file = findAsset.file;
      }

      const depresiationInitial = await this.calculateDepreciationInitial(updateAssetDto);
      const assetDepresiation =
        await this.depreciationService.calculateAndStoreDepreciation(
          depresiationInitial,
        );

      const findUfv = await this.ufvmodel.findOne({ fecha: dateAcquisition });

      if (!findUfv) {
        throw new HttpException(
          'ufv no encotrada para la fecha solicitada',
          404,
        );
      }

      // const ufvCurrent = await this.ufvService.ExtractUfvCurrent();
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');
  
      const formattedDate = `${year}-${month}-${day}`;
      const ufvCurrent = await this.ufvmodel.findOne({ fecha: formattedDate });
      if (!ufvCurrent) {
        throw new HttpException('ufv actual no encontrada',HttpStatus.NOT_FOUND)
      }
      assetDepresiation.ufv3 = (
        price * (ufvCurrent.ufv / findUfv.ufv) -
        price
      ).toFixed(2);
      assetDepresiation.ufv4 = (
        price * (ufvCurrent.ufv / findUfv.ufv) -
        price +
        price
      ).toFixed(2);

      assetDepresiation.informationCountable.code =
        findAsset.informationCountable.code;

      const findSupplier = await this.supplierModel.findOne({
        _id: findAsset.supplier,
      });

      if (!findSupplier) {
        throw new HttpException('proveedor no encotrado', 404);
      }

      // const htmlContent = await this.documentPdf.htmlContent(
      //   updateAssetDto,
      //   findAsset.responsible,
      //   findSupplier,
      // );

      // try {
      //   const res = await this.httpService
      //     .put(
      //       `${getConfig().api_pdf}convert/${
      //         findAsset.informationCountable.documentPdf
      //       }`,
      //       { textPlain: htmlContent },
      //     )
      //     .toPromise();
      //   assetDepresiation.informationCountable.documentPdf = res.data._id;
      // } catch (error) {
      //   throw error.response?.data;
      // }

      try {
        const res = await this.httpService
          .get(
            `${getConfig().api_organigrama}departments/${
              assetDepresiation.location
            }`,
          )
          .toPromise();
      } catch (error) {
        throw error.response?.data;
      }
      const findState = await this.stateModel.findOne({ _id: state });
      if (!findState) {
        this.customErrorService.customResponse(
          HttpStatus.NOT_FOUND, true, 'estado no encontrado', 'el estado que ingreso no se logro encontrar',
        );
      }
      await this.assetModel.findByIdAndUpdate(id, assetDepresiation, { new: true });
    }
    const assets = await this.assetModel.find({
      _id: { $in: assetIds }
    });
    for(const asset of assets) {
      try {
        asset.state = await this.stateModel.findById(asset.state)
        asset.supplier = await this.supplierModel.findById(asset.supplier)
        asset.typeCategoryAsset = await this.depreciationAssetListModel.findById(asset.typeCategoryAsset)
        const resLocation = await this.httpService
          .get(`${getConfig().api_organigrama}departments/${asset.location}`).toPromise();
        
        asset.location = resLocation.data
        asset.informationCountable.documentPdf=""

      } catch (error) {
        throw error.response?.data;
      }
    }
    return assets;
  }

  async darDeBaja(_id: string) {
    const asset = await this.assetModel.findOne({ _id });
    if (!asset) {
      throw new HttpException('activo no encontrado', 404);
    }
    asset.isDeleted = true;
    return asset.save();
  }

  async calculateDepreciationInitial(objectAsset) {
    
    const dataGroupContable = await this.depreciationAssetListModel.find();

    const life = dataGroupContable.find(index => index.assetCategory == objectAsset.typeCategoryAsset );

    if (!life) {
      this.customErrorService.customResponse(
        HttpStatus.NOT_FOUND,
        true,
        'grupo contable no encontrado',
        `el grupo contable ${objectAsset.typeCategoryAsset} no existe`,
      );
    }

    objectAsset.typeCategoryAsset = life._id.toString();
    let depreciatedForYear =
      objectAsset.informationCountable.price / life.usefulLife;
    let depreciationPerDay = depreciatedForYear / 360;

    objectAsset.depreciatedValue = depreciationPerDay;
    return objectAsset;
  }
  //-----------------------
  async generateQRCodeBase64(id:string) {
    try {  
      const asset= await this.assetModel.findOne({_id:id})
      .populate('typeCategoryAsset')
      .populate('supplier')
      .populate('state');
      const findDelivery = await this.deliveryModel.find({});
      const findDevolution = await this.devolutionModel.find({});
      const code =asset.informationCountable.code
      if(asset.responsible && mongoose.Types.ObjectId.isValid(asset.responsible)){
        try {
          const res = await this.httpService.get(`${getConfig().api_personal}api/personal/${asset.responsible}`).toPromise()
          asset.responsible=`${res.data.name} ${res.data.lastName}`
  
        } catch (error) {
          throw error.response?.data;
        }
      }
      try {
        const res = await this.httpService
          .get(`${getConfig().api_organigrama}departments/${asset.location}`)
          .toPromise();
        asset.location = res.data;
      } catch (error) {
        throw error.response?.data;
      }
      if (!asset) {
        this.customErrorService.customResponse(
          HttpStatus.NOT_FOUND,
          true,
          'activo no encontrado',
          'el activo que solicita no se puedo encontrar',
        );
      }

      let Assetobservation = []
        
      for(const Delivery of findDelivery){
        Assetobservation = Delivery.asset.filter(index => index.assetId.toString()==id)
      }
      let observationDevolution = []
      for(const Devolution of findDevolution){
        observationDevolution = Devolution.asset.filter(index => index.assetId.toString()==id)
      }
    
      const dataToEncode = `
        nombre: ${asset.name}\n 
        responsable: ${asset.responsible}\n
        precio: ${asset.informationCountable.price}\n
        estado: ${(asset.state as unknown as States ).name}\n
        proveedor: ${(asset.supplier as unknown as Suppliers ).managerName}\n
        ubicacion: ${(asset.location as unknown as Locations).name}\n
        observación de la entrega: ${Assetobservation.length>0? Assetobservation[0].observation :'no hay observaciones'}\n
        observación de la devolución: ${observationDevolution.length>0? observationDevolution[0].observation :'no hay observaciones'}
      `;
             
      // Encripta los datos--poner variables de entorno 
      const secretKey = 'tu_clave_secreta';
      const cipher = crypto.createCipher('aes-256-cbc', secretKey);
      let encryptedData = cipher.update(dataToEncode, 'utf8', 'hex');
      encryptedData += cipher.final('hex');
      
      // Genera el código QR a partir de los datos encriptados
      const qrCodeDataUrl = await QRCode.toDataURL(encryptedData);
      return {
        _id:id,
        qrCodeDataUrl,
        code:code
      };
    
    } catch (error) {
      throw error;
    }
  }
  async documentsPdf(id:string){
    const asset = await this.assetModel.findById(id).populate('supplier')
    if (!asset) {
      this.customErrorService.customResponse(
        HttpStatus.NOT_FOUND,
        true,
        'activo no encontrado',
        'el activo que solicita no se puedo encontrar',
      );
    }

    const htmlContent = await this.documentPdf.htmlContent(
      asset,
      asset.responsible,
      asset.supplier
      );
    
    // let documentPdf
    // if (asset.informationCountable.documentPdf) {
    //   try {
    //     const responsePdf = await this.httpService
    //       .get(
    //         `${getConfig().api_pdf}convert/${
    //           asset.informationCountable.documentPdf
    //         }`,
    //       )
    //       .toPromise();
    //     documentPdf = responsePdf.data.pdfBase64;
    //   } catch (error) {
    //     throw error.response?.data;
    //   }
    // }
    console.log(htmlContent)
    let responsePdf
    if(!asset.informationCountable.documentPdf){
      try {
        responsePdf = await this.httpService
          .post(`${getConfig().api_pdf}convert`, { textPlain: htmlContent })
          .toPromise();    
      } catch (error) {
        throw error.response?.data;
      }
      asset.informationCountable.documentPdf=responsePdf.data._id
    asset.save()
    }else{
      try {
        responsePdf = await this.httpService
              .put(
                `${getConfig().api_pdf}convert/${asset.informationCountable.documentPdf}`,{textPlain:htmlContent}).toPromise();
          } catch (error) {
            throw error.response?.data;
          }
    }
    
    return {
      _id:id,
      documentPdf:responsePdf.data.pdfBase64
    };
  }  

  async base64Imagen(id:string){
    try {
      const res = await this.httpService.get(`${getConfig().file_upload}file/${id}`).toPromise();
      const base64 = res.data.file.base64;
      const data = {
          _idImagen: id,
          base64,
      };

      return data;
  } catch (error) {
      throw error; 
  } 
  
 }
}
