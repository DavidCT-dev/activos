import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import { Asset } from 'src/asset/schema/asset.schema';
import { Supplier, SupplierDocument } from 'src/supplier/schema/supplier.schema';

@Injectable()
export class SupplierMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>, 
  ){}
  async use(req: Request, res: Response, next: NextFunction) {
    const { managerName, managerCi, managerPhone, businessAddress, email, businessName, NIT, informationAsset } = req.body;

    const expectedFields = ['managerName', 'managerCi', 'managerPhone' ,'businessAddress','email', 'businessName', 'NIT','informationAsset'];

    const extraFields = Object.keys(req.body).filter(
      (key) => !expectedFields.includes(key),
    );

    if (extraFields.length > 0) {
      throw new HttpException(
        `Campos no válidos en la solicitud: ${extraFields.join(', ')}`,
        400,
      );
    }

    const missingFields = expectedFields.filter(
      (field) => !req.body.hasOwnProperty(field),
    );

    if (missingFields.length > 0) {
      throw new HttpException(
        `Faltan los siguientes campos en la solicitud: ${missingFields.join(', ',)}`,400);
    }

    if(!(/^[a-zA-Z\s]{2,50}$/).test(managerName)){
      throw new HttpException(
        `ingrese solo valores a-zA-Z de entre 2-50 caracteres en el campo managerName`,400);
    }
        
    if(!(/^[0-9]{7,15}$/).test(managerCi)){
      throw new HttpException('El campo Ci debe contener solo números y tener una longitud entre 7 y 15 caracteres', 400);
    }
    
    if(!(/^[0-9]{7,15}$/).test(managerPhone)){
      throw new HttpException(
        `ingrese solo valores 0-9 de entre 7-10 caracteres en el campo phone`,400);
    }
     
    const findSuppler= await this.supplierModel.findOne({ managerCi, managerPhone, email, NIT,idUser:req.user.toString()})
    if(findSuppler){
      throw new HttpException(
        `registro ya existente`,400);
    }
    next();
  }
}
