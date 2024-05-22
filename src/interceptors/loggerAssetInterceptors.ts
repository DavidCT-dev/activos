import { HttpService } from '@nestjs/axios';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Model } from 'mongoose';
import getConfig from '../config/configuration'
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment-timezone';
import { BitacoraAsset ,BitacoraAssetDocument} from 'src/bitacora/schema/bitacoraAsset.schema';
import { switchMap } from 'rxjs/operators';
import { Asset, AssetDocument } from 'src/asset/schema/asset.schema';

@Injectable()
export class LoggerAssetInterceptors implements NestInterceptor {
    constructor(
        private httpService: HttpService, 
        @InjectModel(BitacoraAsset.name) private readonly bitacoraAssetModel: Model<BitacoraAssetDocument>,
        @InjectModel(Asset.name) private assetModel: Model<AssetDocument>
    ) {}
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        return next.handle().pipe(
            switchMap(async(data) => {

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
                if (Array.isArray(data)) {
                    data.map(async(item) => {
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
                        const dataNew= await new this.bitacoraAssetModel({
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
                 //return data; 
                 let description = '';
                 switch (req.method) {
                   case 'POST':
                        if(req.path === '/delivery'){
                            req.body.assetIds.map(async (item) => { 
                                const assetCode= await this.assetModel.findOne({_id:item})
                                const res = await this.httpService.get(`${getConfig().api_personal}api/personal/${data.receiverId}`).toPromise(); 
                                description = `Se ha realizado la entrega a: ${res.data.name} ${res.data.lastName}, del activo: ${assetCode.informationCountable.code}`;
                                new this.bitacoraAssetModel({
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
                                new this.bitacoraAssetModel({
                                    userId: req.user,
                                    userEmail: dataPersonal.email,
                                    action: `Método: ${req.method}`,
                                    description: description,
                                    path: `${req.headers['origin']}${req.url}`,
                                    timestamp: formattedDateTime,
                                }).save()
                                description=''
                            })
                        }
                        break;
                        case 'PUT':
                        if (req.path.startsWith('/delivery')){
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
                        }
                        break;
                        case 'DELETE':
                        if (req.path.startsWith('/delivery')){
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
                        }
                        break;
                        default:
                        description = '';
                        break;
                    }
                    if(description!=''){
                        const bitacoraEntry = new this.bitacoraAssetModel({
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
    }
}
