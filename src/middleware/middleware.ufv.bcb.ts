import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class UfvBcbMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { dateInitial, dateCurrent } = req.body;

    function isValidDate(dateString: string) {
      const regExpPattern = /^\d{4}-\d{2}-\d{2}$/;
      return regExpPattern.test(dateString);
    }

    const expectedFields = ['dateInitial', 'dateCurrent'];

    const extraFields = Object.keys(req.body).filter(
      (key) => !expectedFields.includes(key),
    );

    if (extraFields.length > 0) {
      throw new HttpException(
        `Campos no válidos en la solicitud: ${extraFields.join(', ')}`,
        400,
      );
    }
//campos borrados controla 
    const missingFields = expectedFields.filter(
      (field) => !req.body.hasOwnProperty(field),
    );

    if (missingFields.length > 0) {
      throw new HttpException(
        `Faltan los siguientes campos en la solicitud: ${missingFields.join(',',)}`,400);
    }

    if (isValidDate(dateInitial) && isValidDate(dateCurrent)) {
      const expectedFields = ['dateInitial', 'dateCurrent'];

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
        `Faltan los siguientes campos en la solicitud: ${missingFields.join(',',)}`,400);
    }
      const minDate = new Date('2001-01-01');
      const parsedDateInitial = new Date(dateInitial);

      if (parsedDateInitial < minDate) {
        throw new HttpException(
          `No existe UFV para la fecha ${parsedDateInitial}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 7);
      const parsedDateFinal = new Date(dateCurrent);

      if (parsedDateFinal > maxDate) {
        throw new HttpException(
          `No existe UFV para la fecha ${parsedDateFinal}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if(new Date(dateInitial) > new Date(dateCurrent)){
        throw new HttpException(
          `la fecha inicial no puede ser mayor a la fecha actual`,
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log (dateInitial, dateCurrent)
      
      next();
    } else {
      throw new HttpException(
        'El formato de las fechas es incorrecto. Debe ser YYYY-MM-DD.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
