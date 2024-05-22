import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { Delivery, DeliveryDocument } from './schema/delivery.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { FilterQuery, Model } from 'mongoose';
import { AssetService } from 'src/asset/asset.service';
import {  Asset, AssetDocument } from 'src/asset/schema/asset.schema';
import { CustomErrorService } from 'src/error.service';
import getConfig from '../config/configuration'
import { HttpService } from '@nestjs/axios';
import { DeliveryCertificate } from './delivery.certificate.service';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { FilterDeliveryDto } from './dto/filter.delivery.dto';
import { State as States, StateDocument } from 'src/state/schema/state.schema';
import { DocumentPdf } from 'src/asset/asset.documentPdf.service';
import * as QRCode from 'qrcode';
import * as crypto from'crypto';
import { Supplier, SupplierDocument } from 'src/supplier/schema/supplier.schema';
import { Devolution } from 'src/devolution/schema/devolution.schema';
import { FilterAssetDto } from 'src/asset/dto/filter.asset.dto';
interface State {
  _id: string;
  name: string;
  isDeleted: boolean;
}

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(States.name) private stateModel: Model<StateDocument>,
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
    private customErrorService:CustomErrorService,
    private httpService:HttpService,
    private deliveryCertificate:DeliveryCertificate,
    private documentPdf: DocumentPdf,
  ){}
  
  async create(createDeliveryDto: CreateDeliveryDto) {
    const {assetIds, receiverId, transmitterId, observation, location} = createDeliveryDto
    for(const _id of assetIds){
      const asset = await this.assetModel.findOne({ _id , isDeleted:false });
      if (!asset) {
        throw new HttpException('activo no encontrado', 404);
      }  
    }
   
    let assetDelivery
    for(const assetId of assetIds ){
      const findAsset = await this.assetModel.findOne({ _id:assetId, isDeleted:false}).populate('state')
      if(!findAsset || (findAsset.state as unknown as State ).name !== 'DISPONIBLE'){
        this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'no encotrado','no se encontro el activo solicitado o no esta disponible')
      }
      let receiver
      let transmitter
      let locationData
      try {
        const resReceiver = await this.httpService.get(
          `${getConfig().api_personal}api/personal/${receiverId}`).toPromise();
        receiver = resReceiver.data

        const resTransmitter = await this.httpService.get(
          `${getConfig().api_personal}api/personal/${transmitterId}`).toPromise();
        transmitter = resTransmitter.data

        const resLocationData = await this.httpService.get(
          `${getConfig().api_organigrama}departments/${location}`).toPromise();
        locationData = resLocationData.data

      } catch (error) {
        throw error.response?.data
      }
      findAsset.responsible=receiverId

      const findState = await this.stateModel.findOne({name:'ASIGNADO'})
      let stateId
      if(!findState){
        const newState= await new this.stateModel({name:'ASIGNADO'}).save()
        stateId =newState._id.toString()
      }else{
        stateId = findState._id.toString()
      }
      const findPersonExists = await this.deliveryModel.findOne({ isDeleted:false,receiverId })
      const findSupplier =await this.supplierModel.findOne({_id:findAsset.supplier, isDeleted:false})
      if(findPersonExists){
        findPersonExists.asset.push({
          assetId,
          date:new Date(Date.now() - 4 * 60 * 60 * 1000),
          observation,
          state:stateId
        })
        await findPersonExists.save()
        findAsset.state = stateId
        await findAsset.save()
        const person = await this.deliveryModel.findOne({receiverId}).populate('asset.assetId').exec();
        const htmlContent = await this.deliveryCertificate.htmlContent(person, transmitter, receiver, locationData)         
        try {
          await this.httpService.put(`${getConfig().api_pdf}convert/${findPersonExists.pdf}`, {textPlain:htmlContent}).toPromise()
        } catch (error) {
          error.response?.data;	    
        }
        const htmlContentAsset = await this.documentPdf.htmlContent(findAsset, receiver,findSupplier)
        try {
          await this.httpService.put(`${getConfig().api_pdf}convert/${findAsset.informationCountable.documentPdf}`, {textPlain:htmlContentAsset}).toPromise()
      
        } catch (error) {
          error.response?.data;	
        }
        
        assetDelivery = await findPersonExists.save()
        //se pasa al siguiente 
        findAsset.assigned=true;
        await findAsset.save()
        assetDelivery.pdf=""
        continue
      }
      const newDelivery = await new this.deliveryModel({
        asset:[{
          assetId,
          date: new Date(Date.now() - 4 * 60 * 60 * 1000),
          observation,
          state:stateId
        }],
        receiverId,
        transmitterId,
        pdf:'',
        location,
      }).save()

      const populatedTransfer = await this.deliveryModel.findById(newDelivery._id).populate('asset.assetId').exec();
      const htmlContent = await this.deliveryCertificate.htmlContent(populatedTransfer, transmitter, receiver, locationData)
      try {
        const res = await this.httpService.post(`${getConfig().api_pdf}convert/`, {textPlain:htmlContent}).toPromise()
        populatedTransfer.pdf = res.data._id
      } catch (error) {
        error.response?.data;	    
      }
      
      findAsset.depopulate()
      findAsset.state = stateId
      await findAsset.save()

      populatedTransfer.depopulate('asset.assetId')
      
      const htmlContentAsset = await this.documentPdf.htmlContent(findAsset, receiver,findSupplier)
      try {
        await this.httpService.put(`${getConfig().api_pdf}convert/${findAsset.informationCountable.documentPdf}`, {textPlain:htmlContentAsset}).toPromise()
      } catch (error) {
        error.response?.data;	
      }
     
    findAsset.assigned=true;
    await findAsset.save()
    assetDelivery = await populatedTransfer.save()
  }
  assetDelivery.pdf=""
  return assetDelivery 
}

  async findAll(user,params?: FilterDeliveryDto) {
    const filters: FilterQuery<Delivery> = { isDeleted: false,idUser:user };
    const { page,limit=10,location,transmitterId,receiverId} = params;
   
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
    if (receiverId) {
      const res= await this.httpService.get(`${getConfig().api_personal}filtered?fullName=${receiverId}`).toPromise();
      const idsPerson = res.data.data.map(index=> index._id)
      if(idsPerson.length > 0){
        for(const id of idsPerson){
          filters.receiverId = {
            $regex: id.toString(),
            $options: 'i',
          };
        }
      }else{
        return[]
      }
    }
    if (transmitterId) {
  
      const res= await this.httpService.get(`${getConfig().api_personal}filtered?fullName=${transmitterId}`).toPromise();
      const idsPerson = res.data.data.map(index=> index._id)
      if(idsPerson.length > 0){
        for(const id of idsPerson){
          filters.transmitterId = {
            $regex: id.toString(),
            $options: 'i',
          };
        }
      }
      else{
        return[]
      }  
    }
    if (page<=0){
      throw new HttpException(
        'El valor de la página no es válido. Debe ser mayor que 0.',
        400,
      );
    }
    if (limit<=0){
      throw new HttpException(
        'El valor de la página no es válido. Debe ser mayor que 0.',
        400,
      );
    }
    const pageSize= limit ;
    const countQuery= this.deliveryModel.find(filters)
    const totalDelivery= await  this.deliveryModel.countDocuments({idUser:user,isDeleted:false});
    const totalDeliverys= await countQuery.countDocuments()
    const totalPages=Math.ceil(totalDeliverys/pageSize)
    const skip=(page - 1)*pageSize || 0;
    const [deliveries] = await Promise.all([
      this.deliveryModel.find().populate('asset.assetId')
        .find(filters)
        .sort({ _id: -1 })
        .limit(pageSize)
        .skip(skip)
        .exec(),
    ])

      const count = await this.deliveryModel.estimatedDocumentCount();
      if (count < 0) {
        return deliveries;
      }   

    let data = {}
    const dataArray = [];
    for (const delivery of deliveries) {
      let assetArray = delivery.asset;
      if (typeof assetArray === 'string') {
        assetArray = JSON.parse(assetArray);
      }
      const asset = await Promise.all(assetArray.flat().map(async(asset: any) => {
        const name = asset.assetId.name
        const code= asset.assetId.informationCountable.code
        const observation = asset.observation
        
        
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
        const findState = await this.stateModel.findOne({ _id: asset.assetId.state});
        
         asset.state=findState.name
       const State=asset.state
        return {name, code ,date, observation,State,file: file ? file : ""}
      }));
      
      let receiver
      let chargeReceiver
      let transmitter
      let chargeTransmitter
      try {
        const res = await this.httpService.get(
          `${getConfig().api_personal}api/personal/${delivery.receiverId}`).toPromise();
          receiver = `${res.data.name} ${res.data.lastName}`
         
          const resCharge = await this.httpService.get(    
            `${getConfig().api_personal}api/charge/${res.data.charge}`).toPromise();
            chargeReceiver = `${resCharge.data.name}`
          

          const resTransmitter = await this.httpService.get(
            `${getConfig().api_personal}api/personal/${delivery.transmitterId}`).toPromise();
            transmitter = `${resTransmitter.data.name} ${resTransmitter.data.lastName}`

          const resTransmitterCharge = await this.httpService.get(    
            `${getConfig().api_personal}api/charge/${resTransmitter.data.charge}`).toPromise();
            chargeTransmitter= `${resTransmitterCharge.data.name} `
      } catch (error) {
        throw error.response?.data
      }
     
      let proceedings
      if (delivery.pdf && delivery.pdf !='') {
        try {
          const res = await this.httpService.get(
            `${getConfig().api_pdf}convert/${delivery.pdf}`).toPromise();
            proceedings = res.data.pdfBase64
        } catch (error) {
          throw error.response?.data
        }
      }else{proceedings=''}
     
      // let qrCode;
      let location
      try {
        const res = await this.httpService.get(
          `${getConfig().api_organigrama}departments/${delivery.location}`).toPromise();
          location = res.data.name
      } catch (error) {
        throw error.response?.data
      }

      data = {
        _id:delivery._id, 
        receiver,
        chargeReceiver,
        transmitter,
        chargeTransmitter,
        location,
        asset,
        pdf:""
      }
      dataArray.push(data);
    }

    return {
      totalDelivery,
      totalPages,
      dataArray
    };
  }

  async getDataQr(code :string){

    const secretKey = 'tu_clave_secreta';
    try {
      
      const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
      let decryptedData = decipher.update(code, 'hex', 'utf8');
      decryptedData += decipher.final('utf8');
  
      // Los datos ahora están descifrados y en la variable decryptedData
      return decryptedData;
    } catch (error) {
      return code
      // throw error; // Maneja los errores adecuadamente en tu aplicación
    }
  }

  async findOne(id: string) {
    const deliverie = await this.deliveryModel.findById(id).populate('asset.assetId') 
    
    if (!deliverie) {
      throw new HttpException('entrega no encontrada', 404);
    }
      
      const count = await this.deliveryModel.estimatedDocumentCount();
      if (count < 0) {
        return deliverie;
      }   

    let data = {}
    // const dataArray = [];

      let assetArray = deliverie.asset;
      if (typeof assetArray === 'string') {
        assetArray = JSON.parse(assetArray);
      }

      const asset = await Promise.all(assetArray.map(async(asset: any) => {

        const name = asset.assetId.name
        const code= asset.assetId.informationCountable.code
        const observation= asset.observation
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
        const findState = await this.stateModel.findOne({ _id: asset.assetId.state});
        
         asset.state=findState.name
       const State=asset.state

        return {_id:asset.assetId._id,name,code, date,observation,State ,file: file ? file : ""}
      }));

      let receiver
      let transmitter
      try {
        const res = await this.httpService.get(
          `${getConfig().api_personal}api/personal/${deliverie.receiverId}`).toPromise();
          receiver = `${res.data.name} ${res.data.lastName}`

          const resTransmitter = await this.httpService.get(
            `${getConfig().api_personal}api/personal/${deliverie.transmitterId}`).toPromise();
            transmitter = `${resTransmitter.data.name} ${resTransmitter.data.lastName}`
      } catch (error) {
        throw error.response?.data
      }
      
      let proceedings
      if (deliverie.pdf && deliverie.pdf !='') {
        try {
          const res = await this.httpService.get(
            `${getConfig().api_pdf}convert/${deliverie.pdf}`).toPromise();
            proceedings = res.data.pdfBase64
        } catch (error) {
          throw error.response?.data
        }
      }else{proceedings=''}
      

      let location
      try {
        const res = await this.httpService.get(
          `${getConfig().api_organigrama}departments/${deliverie.location}`).toPromise();
          location = res.data.name
      } catch (error) {
        throw error.response?.data
      }

      data = {
        _id:deliverie._id, 
        receiver,
        transmitter,
        location,
        asset,
        pdf:""
      }
      // dataArray.push(data);
    
    return data;
  }



  async update(id: string, updateDeliveryDto: UpdateDeliveryDto) {
    const { assetIdNew, assetIdOld ,transmitterId, receiverId,location, observation, stateId } = updateDeliveryDto
    
    const findDelivery = await this.deliveryModel.findById(id)
    
    if(!findDelivery){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'entrega no encontrado','al entrega de activo que solicita no se puedo encontrar')
    }

    const findAssetOld = await this.assetModel.findOne({_id:assetIdOld}).populate('state')

    if(!findAssetOld){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'activo no encontrado','el activo que solicita no se puedo encontrar ')
    }

    const findDeliveryIds = findDelivery.asset.map(id => id.assetId)

    if(!findDeliveryIds.includes(assetIdOld)){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'activo no encontrado',`el usurio no tiene a su cargo el activo que ingreso ${findAssetOld.name}`)
    }
    if(!assetIdNew){}
    const findAssetNew = await this.assetModel.findOne({_id: assetIdNew}).populate('state')


    if(!findAssetNew || (findAssetNew.state as unknown as State ).name !== 'DISPONIBLE'){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'activo no encontrado','el activo que solicita no se puedo encontrar o no esta disponible')
    }

    let transmitter 
    let receiver
    try {
      const res = await this.httpService.get(
        `${getConfig().api_personal}api/personal/${transmitterId}`).toPromise();
        transmitter = res.data

        const resReceiver = await this.httpService.get(
          `${getConfig().api_personal}api/personal/${receiverId}`).toPromise();
          receiver = resReceiver.data
    } catch (error) {
      throw error.response?.data
    }

    let locationData
    try {
      const res = await this.httpService.get(
        `${getConfig().api_organigrama}departments/${location}`).toPromise();
        locationData = res.data
    } catch (error) {
      throw error.response?.data
    }

    const findState = await this.stateModel.findById(stateId)

    if(!findState){
      this.customErrorService.customResponse(HttpStatus.NOT_FOUND, true, 'estado no encontrado','el estado que ingreso no se logro encontrar')
    }

    findDelivery.asset = findDelivery.asset.filter(asset => asset.assetId !== assetIdOld);

    findDelivery.asset.push({
      assetId:assetIdNew,
      observation,
      state:findState._id.toString()
    })
    findDelivery.receiverId = receiverId  
    findDelivery.transmitterId = transmitterId
    findDelivery.location = location
    findAssetOld.state = (findAssetNew.state as unknown as State )._id.toString() 
    findAssetNew.state = findState._id.toString()
    // findDelivery.pdf=""
    
    findDelivery.populate('asset.assetId')
    

    const htmlContent = await this.deliveryCertificate.htmlContent(findDelivery,receiver, transmitter,locationData)

      try {
        const res = await this.httpService.put(`${getConfig().api_pdf}convert/${findDelivery.pdf}`, {textPlain:htmlContent}).toPromise()
        findDelivery.pdf = res.data._id
      } catch (error) {
        error.response?.data;	    
      }
    
    await findDelivery.depopulate()
    await findAssetNew.save()
    await findAssetOld.save()
    await findDelivery.save()
    findDelivery.pdf = "";
    return findDelivery
  }

  async darDeBaja(_id: string) { 
    const deliveries = await this.deliveryModel.findOne({ _id, isDeleted:false });
    if (!deliveries) {
      throw new HttpException('entrega no encontrado', 404);
    }
    try {
      await this.httpService.delete(`${getConfig().api_pdf}convert/${deliveries.pdf}`).toPromise()
      deliveries.pdf='' 
    } catch (error) {
      throw error.response?.data;
    }
    const findState = await this.stateModel.findOne({name:'DISPONIBLE'})
    for(const asset of deliveries.asset){
      const findAsset = await this.assetModel.findOne({ _id: asset.assetId });
      findAsset.state = findState._id.toString() 
      findAsset.save()
    }
    deliveries.isDeleted = true;
    return await deliveries.save();
  }
 async AssetFromPersonal(id:string){
  const findAssetPersonal= await this.deliveryModel.findOne({receiverId:id})

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
  async generateQRCodeBase64(id:string) {   
    const findDelivery = await this.deliveryModel.findOne({_id:id})
    const assetDelivery = await this.assetModel.find({_id:id});
    
    if(findDelivery.transmitterId && mongoose.Types.ObjectId.isValid(findDelivery.transmitterId)&&findDelivery.receiverId&& mongoose.Types.ObjectId.isValid(findDelivery.receiverId)){
      try {
        const resTransmitter = await this.httpService.get(`${getConfig().api_personal}api/personal/${findDelivery.transmitterId}`).toPromise()
        findDelivery.transmitterId=`${resTransmitter.data.name} ${resTransmitter.data.lastName}`
        
        const resReceiver = await this.httpService.get(`${getConfig().api_personal}api/personal/${findDelivery.receiverId}`).toPromise()
        findDelivery.receiverId=`${resReceiver.data.name} ${resReceiver.data.lastName}`
      } catch (error) {
        throw error.response?.data;
      }
    }
    try {
      const res = await this.httpService
        .get(`${getConfig().api_organigrama}departments/${findDelivery.location}`)
        .toPromise();
        findDelivery.location = res.data.name;
    } catch (error) {
      throw error.response?.data;
    }
    if (!findDelivery) {
      this.customErrorService.customResponse(
        HttpStatus.NOT_FOUND,
        true,
        'entrega no encontrada',
        'la entrega que solicita no se puedo encontrar',
      );
    }
    let Asset
    for(const _id of assetDelivery){
      const asset = await this.assetModel.findOne({ _id , isDeleted:false });
      if (!asset) {
        throw new HttpException('activo no encontrado', 404);
      }  
    }
    const dataToEncode = `
      entrego: ${findDelivery.transmitterId}\n
      recibio: ${findDelivery.receiverId}\n
      ubicacion: ${findDelivery.location}\n
      activo/s: ${assetDelivery.map(a => JSON.stringify(a.name)).join('\n')}
    
    `;
      
    const secretKey = 'tu_clave_secreta';
    const cipher = crypto.createCipher('aes-256-cbc', secretKey);
    let encryptedData = cipher.update(dataToEncode, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    const qrCodeDataUrl = await QRCode.toDataURL(encryptedData);
    return {
      _id:id,
      qrCodeDataUrl
    };
    
  }


  async documentsPdf(id:string){
   
    const assetDelivery = await this.deliveryModel
      .findById(id)
    if (!assetDelivery) {
      this.customErrorService.customResponse(
        HttpStatus.NOT_FOUND,
        true,
        'entrega no encontrada',
        'la entrega la solicita no se puedo encontrar',
      );
    }

    let documentPdf
    if (assetDelivery.pdf) {
      try {
        const responsePdf = await this.httpService
          .get(
            `${getConfig().api_pdf}convert/${assetDelivery.pdf
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

