import { HttpException, HttpStatus, Injectable, Redirect } from '@nestjs/common';
import { CreateDevolutionDto } from './dto/create-devolution.dto';
import { UpdateDevolutionDto } from './dto/update-devolution.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Devolution, DevolutionDocument } from './schema/devolution.schema';
import { FilterQuery, Model } from 'mongoose';
import { Delivery, DeliveryDocument } from 'src/delivery/schema/delivery.schema';
import { Asset, AssetDocument } from 'src/asset/schema/asset.schema';
import { CustomErrorService } from 'src/error.service';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration'
import { DevolutionCertificate } from './devolution.certificate.service';
import { State as States, StateDocument } from 'src/state/schema/state.schema';
import { DeliveryCertificate } from 'src/delivery/delivery.certificate.service';
import { FilterAssetDto } from 'src/asset/dto/filter.asset.dto';

interface State {
  _id: string;
  name: string;
  isDeleted: boolean;
}

@Injectable()
export class DevolutionService {

  constructor(
    @InjectModel(Devolution.name) private devolutionModel: Model<DevolutionDocument>,
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(States.name) private stateModel: Model<StateDocument>,
    private customErrorService: CustomErrorService,
    private httpService: HttpService,
    private devolutionCertificate:DevolutionCertificate,
    private deliveryCertificate:DeliveryCertificate
  ){}

  async create(createDevolutionDto: CreateDevolutionDto) {
    const { assetIds, observation, transmitterId, receiverId, location, stateId } = createDevolutionDto
    for(const _id of assetIds){
      const asset = await this.assetModel.findOne({ _id , isDeleted:false });
      if (!asset) {
        throw new HttpException('activo no encontrado', 404);
      }  
    }

    let devolutionAsset

    for(const assetId of assetIds){
      const findAsset = await this.assetModel.findOne({isDeleted:false,_id:assetId}).populate('state')

      if(!findAsset || (findAsset.state as unknown as State ).name === 'DISPONIBLE'){
        this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro el activo solicitado o no esta en uso')
      }

      let transmitter
      let receiver
      let locationData

      try {
        const resTransmitter = await this.httpService.get(`${getConfig().api_personal}api/personal/${transmitterId}`).toPromise();
        transmitter = resTransmitter.data
        const resReceiver = await this.httpService.get(`${getConfig().api_personal}api/personal/${receiverId}`).toPromise();
        receiver = resReceiver.data
        const resLocationData = await this.httpService.get(`${getConfig().api_organigrama}departments/${location}`).toPromise();
        locationData = resLocationData.data
      } catch (error) {
        throw error.response?.data
      }
      const findState = await this.stateModel.findOne({_id:stateId})
      if(!findState){
        this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'estado no encontrado','el estado que ingreso no se logro encontrar')
      }
      const findDeliveryPerson = await this.deliveryModel.findOne({isDeleted:false ,receiverId})
      if(!findDeliveryPerson){
        this.customErrorService.customResponse(HttpStatus.CONFLICT, true, 'conflicto','no se le entrego ningun activo a la persona solicitada, no tiene activos que devolver')
      }
      const findDeliveryIds = findDeliveryPerson.asset.map(id => id.assetId.toString())

      if(findDeliveryIds.includes(assetId.toString())){
        if(findDeliveryPerson.location != location){
          this.customErrorService.customResponse(HttpStatus.CONFLICT, true, 'conflicto','la ubicacion del activo ingresado no corresponde al que se envio')
        }      
        findDeliveryPerson.asset = findDeliveryPerson.asset.filter(item => item.assetId.toString() !== assetId)
          

        findAsset.state = findState._id.toString()
        await findAsset.save()
        const findDevolutionPerson = await this.devolutionModel.findOne({isDeleted:false, receiverId})
        if(findDevolutionPerson){
          findDevolutionPerson.asset.push({
            assetId,
            observation,
            state:stateId,
            date:new Date(Date.now() - 4 * 60 * 60 * 1000)
          })
        await findDevolutionPerson.populate('asset.assetId')

        const htmlContentDevolution = await this.devolutionCertificate.htmlContent( findDevolutionPerson, transmitter, receiver,locationData)

        findDeliveryPerson.populate('asset.assetId')

        const htmlContentDelivery = await this.deliveryCertificate.htmlContent( findDeliveryPerson.asset, transmitter, receiver,locationData)
        
    
        await findDevolutionPerson.depopulate()

        try {
          const res = await this.httpService.put(`${getConfig().api_pdf}convert/${findDevolutionPerson.pdf}`, {textPlain:htmlContentDevolution}).toPromise()
          findDevolutionPerson.pdf = res.data._id

          await this.httpService.put(`${getConfig().api_pdf}convert/${findDeliveryPerson.pdf}`, {textPlain:htmlContentDelivery}).toPromise()
          
        } catch (error) {
          error.response?.data;	    
        }
        await findDeliveryPerson.depopulate()
        devolutionAsset = await findDevolutionPerson.save()
        // devolutionAsset.pdf=""
       
        await devolutionAsset
        continue
      }

      const newDevolution = await new this.devolutionModel({
        asset:[{
          assetId,
          date: new Date(Date.now() - 4 * 60 * 60 * 1000),
          observation,
          state:stateId
        }],
        receiverId,
        transmitterId,
        pdf:"",
        location,
      }).save()

      const populatedDevolution = await this.devolutionModel.findById(newDevolution._id).populate('asset.assetId').exec();      
      
      const htmlContent = await this.devolutionCertificate.htmlContent(populatedDevolution,transmitter, receiver,locationData)

      findDeliveryPerson.populate('asset.assetId')

      const htmlContentDelivery = await this.deliveryCertificate.htmlContent( findDeliveryPerson.asset, transmitter, receiver,locationData)

      try {
       const res = await this.httpService.post(`${getConfig().api_pdf}convert/`, {textPlain:htmlContent}).toPromise()
       populatedDevolution.pdf = res.data._id

       await this.httpService.put(`${getConfig().api_pdf}convert/${findDeliveryPerson.pdf}`, {textPlain:htmlContentDelivery}).toPromise()

      } catch (error) {
        throw error.response?.data;	    
      }

      await findDeliveryPerson.depopulate()
      
      await populatedDevolution.depopulate('asset.assetId')
      await findDeliveryPerson.save()

     devolutionAsset = await populatedDevolution.save()
     
    }
    
    }
    // devolutionAsset.pdf=""
  //  this.customErrorService.customResponse(HttpStatus.CONFLICT, true, 'conflicto','no se le asigno el activo a dicho usuario') 
  return  devolutionAsset
}



async findAll(user,params?: FilterAssetDto) {
  const filters: FilterQuery<Devolution> = { isDeleted: false,idUser:user };
    const { page,limit=10,location} = params;
    if (location) {
      const organigrama = await this.httpService.get(`${getConfig().api_organigrama}departments/departments/`).toPromise();
      const findLocation = organigrama.data.find(item => new RegExp(location, 'i').test(item.name));
      if(findLocation){
        filters.location = {
          $regex: findLocation._id.toString(),
          $options: 'i',
        };
      }else{
        return []
      }
    }
    if (limit<=0){
      throw new HttpException(
        'El valor de la página no es válido. Debe ser mayor que 0.',
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
    const countQuery= this.devolutionModel.find(filters)
    const totalDevolution= await  this.devolutionModel.countDocuments({idUser:user,isDeleted:false});
    const totalDevolutions= await countQuery.countDocuments()
    const totalPages=Math.ceil(totalDevolutions/pageSize)
    const skip=(page - 1)*pageSize || 0;
    const [devolutions] = await Promise.all([
      this.devolutionModel.find({isDeleted:false}).populate('asset.assetId')
        .find(filters)
        .sort({ _id: -1 })
        .limit(pageSize)
        .skip(skip)
        .exec(),
    ])
    const count = await this.devolutionModel.estimatedDocumentCount();
    if (count < 0) {
      return devolutions;
    }   

  // const devolutions = await this.devolutionModel.find({isDeleted:false}).populate('asset.assetId')

  // const count = await this.deliveryModel.estimatedDocumentCount();
    
  // if (count < 0) {
  //   return [];
  // }   

  let data = {}
  const dataArray = [];
  for (const devolution of devolutions) {
    let assetArray = devolution.asset;
    if (typeof assetArray === 'string') {
      assetArray = JSON.parse(assetArray);
    }

    const asset = await Promise.all(assetArray.map(async(asset: any) => {
      const name = asset.assetId.name
      const _id = asset.assetId._id
      const code =asset.assetId.informationCountable.code
      const date = asset.date.toISOString().split('T')[0];

      let file 
      if(asset.file){
          try {
            const res = await this.httpService
              .get(`${getConfig().file_upload}file/${asset.file}`)
              .toPromise();
            file = res.data.file.base64
          } catch (error) {
            throw error.response?.data;
          }
      } 
      return {_id,name,code, date, file: file ? file : ""}
    }));

    let receiver
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${devolution.receiverId}`).toPromise();
        receiver = `${res.data.name} ${res.data.lastName}`
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }
    
    let proceedings
    if (devolution.pdf && devolution.pdf !='') {
      try {
        const res = await this.httpService.get(
          `${getConfig().api_pdf}convert/${devolution.pdf}`).toPromise();
          proceedings = res.data.pdfBase64
      } catch (error) {
        throw new HttpException('acta de devolucion no encotrada', HttpStatus.NOT_FOUND)
      }
    }else{proceedings=''}
    
    let transmitter
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${devolution.transmitterId}`).toPromise();
        transmitter = `${res.data.name} ${res.data.lastName}`
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }
    let location
      try {
        const res = await this.httpService.get(
          `${getConfig().api_organigrama}departments/${devolution.location}`).toPromise();
          location = res.data.name
      } catch (error) {
        throw error.response?.data
      }
    
    data = {
      _id:devolution._id, 
      receiver,
      transmitter,
      location,
      asset,
      proceedings:"",
    }
    dataArray.push(data);
  }
  return  {totalDevolution,totalPages,dataArray};
}


async findOne(id: string) {
  const devolution = await this.devolutionModel.findOne({isDeleted:false}).populate('asset.assetId')

  if(!devolution){
    throw new HttpException('devolucion no encontrada', HttpStatus.NOT_FOUND)
  }

  let data = {}

    let assetArray = devolution.asset;
    if (typeof assetArray === 'string') {
      assetArray = JSON.parse(assetArray);
    }

    const asset = await Promise.all(assetArray.map(async(asset: any) => {
      const _id = asset.assetId._id
      const name = asset.assetId.name
      const code =asset.assetId.informationCountable.code
      const date = asset.date.toISOString().split('T')[0];

      let file
      if(asset.file){
          try {
          const res = await this.httpService
              .get(`${getConfig().file_upload}file/${asset.file}`)
              .toPromise();
            file = res.data.file.base64
          } catch (error) {
            throw error.response?.data;
          }
      } 
      return {_id,name, code ,date, file: file ? file : ""}
    }));

    let receiver
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${devolution.receiverId}`).toPromise();
        receiver = `${res.data.name} ${res.data.lastName}`
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }
   
    
    let proceedings : any
    try {
      const res = await this.httpService.get(
        `${getConfig().api_pdf}convert/${devolution.pdf}`).toPromise();
        proceedings = res.data.pdfBase64
    } catch (error) {
      throw new HttpException('acta no encotrada', HttpStatus.NOT_FOUND)
    }
    let transmitter : any
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${devolution.transmitterId}`).toPromise();
        transmitter = `${res.data.name} ${res.data.lastName}`
    } catch (error) {
      throw new HttpException('persona no encontrada', HttpStatus.NOT_FOUND)
    }
    data = {
      receiver,
      transmitter,
      asset,
      proceedings:"",
    }
  
  return data;
}


async update(id: string, updateDeliveryDto: UpdateDevolutionDto) {
  const { assetIdNew, assetIdOld ,observation,transmitterId,receiverId,stateId,location } = updateDeliveryDto
  
  const findDevolution = await this.devolutionModel.findById(id)

  if(!findDevolution){
    this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'devolucion no encontrada','no se encontro registro de devolucion para el activo que solicita')
  }
  
  const findPersonDelivery = await this.deliveryModel.findOne({isDeleted:false,receiverId:findDevolution.receiverId})
 
  if(!findPersonDelivery){
    this.customErrorService.customResponse(HttpStatus.BAD_REQUEST, true, 'mala peticion','el usuario no tiene actas de entrega de activos')
  }

let transmitter
let receiver
let locationData
  try {
    const res = await this.httpService.get(
      `${getConfig().api_personal}api/personal/${transmitterId}`).toPromise();
      transmitter = res.data

    const resReceiver = await this.httpService.get(
      `${getConfig().api_personal}api/personal/${receiverId}`).toPromise();
      receiver = resReceiver.data

      const resLocation = await this.httpService.get(
        `${getConfig().api_organigrama}departments/${location}`).toPromise();
        locationData = resLocation.data
  } catch (error) {
    throw error.response?.data
  }

  const findDevolutionIds = findDevolution.asset.map(id => id.assetId.toString())
  

  if(findDevolutionIds.includes(assetIdOld)){
    
    const findDeliveryIds = findPersonDelivery.asset.map(id => id.assetId.toString())
    if(findDeliveryIds.includes(assetIdNew)){
    
      const assetDevolutionRemove = findDevolution.asset.filter(item => item.assetId.toString() == assetIdOld)

      findDevolution.asset = findDevolution.asset.filter(item => item.assetId.toString() !== assetIdOld)
      
      const assetDeliveryRemove = findPersonDelivery.asset.filter(item => item.assetId.toString() == assetIdNew)

      findPersonDelivery.asset = findPersonDelivery.asset.filter(item => item.assetId.toString() !== assetIdNew)

      findPersonDelivery.asset.push({
        assetId:assetDevolutionRemove[0].assetId,
        date:assetDeliveryRemove[0].date,
        observation:assetDevolutionRemove[0].observation,
        state:assetDeliveryRemove[0].state
      })
      
      findDevolution.asset.push({
        assetId:assetDeliveryRemove[0].assetId,
        date:assetDevolutionRemove[0].date,
        observation,
        state:stateId
      })
      findDevolution.populate('asset.assetId')

      const htmlContent = await this.devolutionCertificate.htmlContent(findDevolution, receiver, transmitter,locationData)
        
      findDevolution.depopulate()
      
      try {
        const res = await this.httpService.put(`${getConfig().api_pdf}convert/${findDevolution.pdf}`, {textPlain:htmlContent}).toPromise()
        findDevolution.pdf = res.data._id
      } catch (error) {
        error.response?.data;	    
      }
      
      await findPersonDelivery.save();
      findPersonDelivery.pdf=""
      return await findDevolution.save();

    }else{
      this.customErrorService.customResponse(HttpStatus.BAD_REQUEST, true, 'mala peticion','el activo ingresado no se encuentra en las actas de entrega del usuario')
    }
  }else{
    this.customErrorService.customResponse(HttpStatus.BAD_REQUEST, true, 'mala peticion','el activo ingresado no se encuentra en la devolucion solicitada')  
  }

}



  async remove(_id: string) { 
    const devolution = await this.devolutionModel.findOne({ _id });
    if (!devolution) {
      throw new HttpException('devolucion no encontrado', 404);
    }

    try {
      await this.httpService.delete(`${getConfig().api_pdf}convert/${devolution.pdf}`).toPromise()
      devolution.pdf=''
    } catch (error) {
      throw error.response?.data;
    }
  
    devolution.isDeleted = true;
    return  await devolution.save();
  }

  async AssetFromPersonal(id:string){
  const findAssetPersonal= await this.devolutionModel.findOne({receiverId:id})

  if(!findAssetPersonal){
    return []
  }
  
  let data =[]
  
    for(let assetDelivery of findAssetPersonal.asset){

      const asset = await this.assetModel.findById  (assetDelivery.assetId);

      data.push({
        _idAsset : asset._id,
        name: asset.name, 
        code: asset.informationCountable.code
      })
    }
    return data
  }
  async documentsPdf(id:string){
    const assetDevolution = await this.devolutionModel
      .findById(id)

    if (!assetDevolution) {
      this.customErrorService.customResponse(
        HttpStatus.NOT_FOUND,
        true,
        'activo no encontrado',
        'el activo que solicita no se puedo encontrar',
      );
    }

    let documentPdf
    if (assetDevolution.pdf) {
      try {
        const responsePdf = await this.httpService
          .get(
            `${getConfig().api_pdf}convert/${assetDevolution.pdf
            }`,  
          )
          .toPromise();
        documentPdf = responsePdf.data.pdfBase64;
      } catch (error) {
        throw error.response?.data;
      }
    }
    return {
      _id:id,
      documentPdf
    };

  }

}
