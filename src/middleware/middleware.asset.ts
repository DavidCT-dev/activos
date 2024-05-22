import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

@Injectable()
export class AssetMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const {name, description, file,supplier, state, assetIds } = req.body

    let expectedFields
    if(req.method == 'POST'){
      expectedFields = ['name', 'description','supplier', 'file', 'typeCategoryAsset','state', 'informationCountable', 'location'];
    }else if(req.method == 'PUT'){
      expectedFields = ['assetIds','name', 'description', 'supplier', 'file', 'typeCategoryAsset','state', 'informationCountable', 'location'];
    } else {
      expectedFields = ['name', 'description', 'responsible','supplier', 'file', 'typeCategoryAsset','state', 'informationCountable', 'location'];
    }

    const validKeys = Object.keys(req.body);
    const missingFields = expectedFields.filter((field) => !validKeys.includes(field));
    const extraFields = validKeys.filter((key) => !expectedFields.includes(key));

    if (missingFields.length > 0) {
      throw new HttpException(`Faltan los siguientes campos en la solicitud: ${missingFields.join(', ')}`, 400);
    }

    if (extraFields.length > 0) {
      throw new HttpException(`Campos no válidos en la solicitud: ${extraFields.join(', ')}`, 400);
    }

    const informationCountable = req.body.informationCountable;
    const location = req.body.location;

    let expectedInformationFields

    if(req.method == 'POST'){
      expectedInformationFields = ['price', 'dateAcquisition', 'warrantyExpirationDate','lote'];
    }else if(req.method == 'PUT'){
      expectedInformationFields = ['price', 'dateAcquisition', 'warrantyExpirationDate'];
    } else {
      expectedInformationFields = ['price', 'dateAcquisition', 'warrantyExpirationDate','lote'];
    }

    const validInformationKeys = Object.keys(informationCountable);
    const missingInformationFields = expectedInformationFields.filter((field) => !validInformationKeys.includes(field));
    const extraInformationFields = validInformationKeys.filter((key) => !expectedInformationFields.includes(key));

    if (missingInformationFields.length > 0) {
      throw new HttpException(`Faltan los siguientes campos en la información contable: ${missingInformationFields.join(', ')}`, 400);
    }

    if (extraInformationFields.length > 0) {
      throw new HttpException(`Campos no válidos en la información contable: ${extraInformationFields.join(', ')}`, 400);
    }

    const { dateAcquisition, price } = req.body.informationCountable;
    if(!(/^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s_.,]{2,50}$/).test(name)){
      throw new HttpException(
        `ingrese solo valores a-z A-Z 0-9 de entre 2-30 caracteres en el campo nombre`,400);
    }
    
    if(!(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,-_]{2,500}$/).test(description)){ 
      throw new HttpException(
        `ingrese solo valores a-z A-Z 0-9 caracteres en el campo descripcion`,400);
    }
   
    if (assetIds) {
      if(assetIds.length>0){
        for(const id of assetIds){
          if (!Types.ObjectId.isValid(id)){
            throw new HttpException('activos seleccionado/s incorrecto/s', HttpStatus.BAD_REQUEST);
          }
        }
      }
    }
    if (!Types.ObjectId.isValid(supplier)) {
      throw new HttpException('proveedor incorrecto', HttpStatus.BAD_REQUEST);
    }
    // if (file) {
    //   const isBase64 = /^data:image\/[a-zA-Z]*;base64,/.test(file);
    //   const isEmpty = file.trim() === '';
    //   if (!isBase64 && !isEmpty) {
    //     throw new HttpException('Imagen incorrecta.', HttpStatus.BAD_REQUEST);
    //   }
    // }
    if (!Types.ObjectId.isValid(location)) {
      throw new HttpException('ubicacion incorrecta', HttpStatus.BAD_REQUEST);
    }
    if (!Types.ObjectId.isValid(state)) {
      throw new HttpException('estado incorrecta', HttpStatus.BAD_REQUEST);
    }

    if(parseFloat(price) <= 0 ){
      throw new HttpException(`el precio debe ser mayor a 0 Bs y debe ser numerico`,400);
    }
    
    const parsedDateAcquisition = new Date(dateAcquisition);
    
    if (isNaN(parsedDateAcquisition.getTime())) {
      throw new HttpException('El campo fecha de adquisicion debe ser una fecha válida', 400);
    }
    const currentDate = new Date();

    if (parsedDateAcquisition >= currentDate) {
      throw new HttpException('El campo fecha de adquisicion debe ser menor a la fecha actual', 400);
    }
  
    next();
  }
}