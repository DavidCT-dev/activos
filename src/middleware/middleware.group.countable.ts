import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class GroupCountableMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { assetCategory, usefulLife } = req.body;

    const expectedFields = ['assetCategory', 'usefulLife','subCategory'];

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

    if(!(/^[a-zA-Z\s]{2,50}$/).test(assetCategory)){
      throw new HttpException(
        `ingrese solo valores a-zA-Z de entre 2-50 caracteres en el campo grupo contable`,400);
    }
    
    if(!(/^[0-9]{1,2}$/).test(usefulLife)){
      throw new HttpException(
        `ingrese solo valores 0-9 de entre 1-2 caracteres en el campo vida util`,400);
    }
    next();
  }
}
