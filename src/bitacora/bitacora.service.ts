import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bitacora, BitacoraDocument } from './schema/bitacora.schema';
import { Model } from 'mongoose';
import { BitacoraAsset, BitacoraAssetDocument } from './schema/bitacoraAsset.schema';

@Injectable()
export class BitacoraService {
  constructor(
    @InjectModel(Bitacora.name) private readonly bitacoraModel: Model<BitacoraDocument>,
    @InjectModel(BitacoraAsset.name) private readonly bitacoraAssetModel: Model<BitacoraAssetDocument>,
  ){}
  async getAllBitacora(user:string){
    return await this.bitacoraModel.find({userId:user}).sort({  _id: -1 }); 

  }
  async getAllBitacoraAsset(user:string){
    return await this.bitacoraAssetModel.find({userId:user}).sort({  _id: -1 }); 

  }
}
