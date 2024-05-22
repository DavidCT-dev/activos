import { HttpService } from '@nestjs/axios';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Model } from 'mongoose';
import { Bitacora, BitacoraDocument } from 'src/bitacora/schema/bitacora.schema';
import getConfig from '../config/configuration'
import { CustomErrorService } from 'src/error.service';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment-timezone';
import { Asset, AssetDocument } from 'src/asset/schema/asset.schema';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(
    private httpService: HttpService,
    @InjectModel(Bitacora.name) private readonly bitacoraModel: Model<BitacoraDocument>,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
  ) {}
   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
      return next.handle().pipe(
        map(async(data) => {
          

          const date = new Date()
            const boliviaTime = moment.utc(date).tz('America/La_Paz');
            const formattedDateTime = boliviaTime.format('YYYY-MM-DD:HH:mm:ss');

          let resPersonal
          try {
            resPersonal = await this.httpService.get(`${getConfig().api_personal}api/personal/${req.user}`).toPromise();
          } catch (error) {
            throw error.response?.data
          }
          const dataPersonal = resPersonal.data;
        //   let resPersonalDevolution
        //  if(data.receiverId){
        //    resPersonalDevolution = await this.httpService.get(`${getConfig().api_personal}api/personal/${data.receiverId}`).toPromise();
        //  }

          if (Array.isArray(data)) {
           
            data.map(async (item) => {
              if (item.informationCountable && item.informationCountable.code) {
                let description = '';
                switch (req.method) {
                  case 'POST':
                    description = `creo un activo con con el codigo: ${item.informationCountable.code}`;
                    break;
                  case 'PUT':
                    description = `actualizo un activo con el codigo: ${item.informationCountable.code}`
                    break;
                  case 'DELETE':
                    description = `elimino un activo con el codigo: ${item.informationCountable.code}`;
                    break;
                  default:
                    description = '';
                    break;
                }

                new this.bitacoraModel({
                  userId: req.user,
                  userEmail: dataPersonal.email,
                  action: `Método: ${req.method}`,
                  description: description,
                  path: `${req.headers['origin']}${req.url}`,
                  timestamp: formattedDateTime,
                }).save()
              } 
            });
          }

            let description = '';
            switch (req.method) {
              case 'POST':
                if (req.path === '/get-ufv') {
                  description = `Solicito las UFVs a través del BCB correspondientes al período comprendido entre el ${req.body.dateInitial} y el ${req.body.dateCurrent}.`;
                } else if (req.path.startsWith('/asset')) {
                  break;
                } else if(req.path === '/depreciation-asset-list') {
                  description = `Se creo el grupo contable: ${data.assetCategory}`;
                } else if(req.path === '/state') {
                  description = `Se creo el estado: ${data.name}`;
                } else if(req.path === '/supplier'){
                  description = `Se creo el proveedor: ${data.managerName} con el nombre del negocio : ${data.businessName}`;
                }else if(req.path === '/api/redirect-to-main'){
                  description = `inicio sesion en la app activos ${dataPersonal.name} ${dataPersonal.lastName}`;                 
                }else if(req.path === '/delivery'){
                  req.body.assetIds.map(async (item) => {
                    
                    const assetCode= await this.assetModel.findOne({_id:item})
                    const res = await this.httpService.get(`${getConfig().api_personal}api/personal/${data.receiverId}`).toPromise(); 
                    description = `Se ha realizado la entrega a: ${res.data.name} ${res.data.lastName}, del activo: ${assetCode.informationCountable.code}`;
                    
                    new this.bitacoraModel({
                      userId: req.user,
                      userEmail: dataPersonal.email,
                      action: `Método: ${req.method}`,
                      description: description,
                      path: `${req.headers['origin']}${req.url}`,
                      timestamp: formattedDateTime,
                    }).save()
                    description=''
                  })
                  
                }else if(req.path === '/devolution'){
                  
                  req.body.assetIds.map(async (item) => {
                    
                    const assetCode= await this.assetModel.findOne({_id:item})
                    const res = await this.httpService.get(`${getConfig().api_personal}api/personal/${data.transmitterId}`).toPromise(); 
                    const resRecived = await this.httpService.get(`${getConfig().api_personal}api/personal/${data.receiverId}`).toPromise()

                    description = `se realizo la devolucion a: ${res.data.name } ${res.data.lastName}, el activo: ${assetCode.informationCountable.code}, lo entrego: ${resRecived.data.name } ${resRecived.data.lastName}`;
                    
                    new this.bitacoraModel({
                      userId: req.user,
                      userEmail: dataPersonal.email,
                      action: `Método: ${req.method}`,
                      description: description,
                      path: `${req.headers['origin']}${req.url}`,
                      timestamp: formattedDateTime,
                    }).save()
                    description=''
                  })
                }else if(req.path === '/permission'){
                  description = `creo un permiso con id: `;
                }
                
                break;
              case 'PUT':
                if (req.path.startsWith('/asset')){
                  break;
                }else if (req.path.startsWith('/depreciation-asset-list')){
                  description = `actualizo el grupo contable: ${data.assetCategory}`
                }else 
                if (req.path.startsWith('/state')){
                  description = `actualizo el estado: ${data.name}`
                }else 
                if (req.path.startsWith('/supplier/update')){
                  description = `actualizo el proveedor: ${data.managerName} con el nombre del negocio: ${data.businessName}`;
                }else if (req.path.startsWith(`/supplier/restart-supplier`)){
                  const {}=req.body
                  description = `restauro el proveedor: ${data.managerName}`   
                }else if (req.path.startsWith('/delivery')){
                  const res=await this.httpService.get(`${getConfig().api_personal}api/personal/${data.receiverId}`).toPromise()
                  const{assetIdNew,assetIdOld}=req.body
                  const findAsset= await this.assetModel.findById(assetIdNew)
                  const findAssetOld= await this.assetModel.findById(assetIdOld)
                  description = `actualizo la entrega de la persona: ${res.data.name} ${res.data.lastName}, del activo:${findAsset?.informationCountable.code || findAssetOld?.informationCountable.code}`
                }else if (req.path.startsWith('/devolution')){
                  const res=await this.httpService.get(`${getConfig().api_personal}api/personal/${data.receiverId}`).toPromise()
                  const{assetIdNew,assetIdOld}=req.body
                  const findAsset= await this.assetModel.findById(assetIdNew)
                  const findAssetOld= await this.assetModel.findById(assetIdOld)
                  description = `actualizo la devolucion de la persona: ${res.data.name} ${res.data.lastName}, del activo:${findAsset?.informationCountable.code || findAssetOld?.informationCountable.code}`
                }else 
                if (req.path.startsWith('/permission')){
                  description = `actualizo un permiso con el id: `
                }


                break;
              case 'DELETE':
                if (req.path.startsWith('/asset')){
                  break;
                }else if (req.path.startsWith('/depreciation-asset-list')){
                  description = `Se elimino el grupo contable: ${data.assetCategory}`
                }else  if (req.path.startsWith('/state')){
                  description = `Se elimino el estado: ${data.name}`
                }else if (req.path.startsWith('/supplier')){
                  description = `Se elimino el proveedor con id: ${data.managerName}`
                }else if (req.path.startsWith('/delivery')){
                  const res=await this.httpService.get(`${getConfig().api_personal}api/personal/${data.receiverId}`).toPromise()
                  const{assetIdNew,assetIdOld}=req.body
                  const findAsset= await this.assetModel.findById(assetIdNew)
                  const findAssetOld= await this.assetModel.findById(assetIdOld)
                  description = `Se elimino la entrega de la persona: ${res.data.name} ${res.data.lastName}, del activo:${findAsset?.informationCountable.code || findAssetOld?.informationCountable.code}`
                }else if (req.path.startsWith('/devolution')){
                  const res=await this.httpService.get(`${getConfig().api_personal}api/personal/${data.receiverId}`).toPromise()
                  const{assetIdNew,assetIdOld}=req.body
                  const findAsset= await this.assetModel.findById(assetIdNew)
                  const findAssetOld= await this.assetModel.findById(assetIdOld)
                  description = `Se elimino la devolucion de la persona: ${res.data.name} ${res.data.lastName}, del activo:${findAsset?.informationCountable.code || findAssetOld?.informationCountable.code}`
                }else if (req.path.startsWith('/permission')){
                  description = `Se elimino un permiso con id: `
                }
                
                break;
              default:
                description = '';
                break;
            }


            if(description!=''){
              const bitacoraEntry = new this.bitacoraModel({
              userId:req.user,
              userEmail: dataPersonal.email,
              action: `Método: ${req.method}`,
              description,
              path: `${req.headers['origin']}${req.url}`,
              timestamp:formattedDateTime
            });
            await bitacoraEntry.save();
            }
            
            return data; 
        }),
      )   
    return next.handle();
  }
}
