import { HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class QueryParamsValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const {  page,limit, state, nameAsset, location, code,typeCategoryAsset,responsible} = req.query;

const allowedFields = ['location','page', 'limit', 'state', 'nameAsset', 'code','typeCategoryAsset','responsible'];
const queryParams = Object.keys(req.query);

const invalidFields = queryParams.filter(field => !allowedFields.includes(field));

if (invalidFields.length > 0) {
  res.status(400).send(`Campos no permitidos en los parámetros de consulta: ${invalidFields.join(', ')}`);
}
   
    if (limit !== undefined) {
      const parsedLimit = parseInt(limit.toString());
      if(parsedLimit >= 0){
        
      }else{throw new HttpException('limit debe ser mayor a 0',400)}
    }
    
    if (page !== undefined) {
      const parsedPage = parseInt(page.toString());
      if(parsedPage >= 0){
        
      }else{throw new HttpException('page debe ser mayor a 0',400)}
    }
    
    if (state !== undefined) {
      if (!/^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(state.toString())) {
        throw new HttpException('El valor del campo "state" debe ser de tipo a-z A-Z', 400);
      }
      
    }
    if (responsible !== undefined) {
      if (!/^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(responsible.toString())) {
        throw new HttpException('El valor del campo "responsable" debe ser de tipo a-z A-Z ', 400);
      }
      
    }
    if (typeCategoryAsset!== undefined) {
      if (!/^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(typeCategoryAsset.toString())) {
        throw new HttpException('El valor del campo "state" debe ser de tipo a-z A-Z ', 400);
      }
      
    }
    if (location !== undefined) {
      if (!/^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(location.toString())) {
        throw new HttpException('El valor del campo "location" debe ser de tipo a-z A-Z', 400);
      }
      
    }
    if (nameAsset !== undefined) {
      if(/^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(nameAsset.toString())){
        
      }else{throw new HttpException('nameAsset solo acepta a-z A-Z 0-9',400)}
      
    }
    next();
  }
}