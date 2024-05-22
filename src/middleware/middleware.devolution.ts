import { HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { Devolution, DevolutionDocument } from 'src/devolution/schema/devolution.schema';
import { Delivery } from 'src/delivery/schema/delivery.schema';

@Injectable()
export class DevolutionMiddleware implements NestMiddleware {
  // @InjectModel(Devolution.name) private devolutionModel : Model<DevolutionDocument>
  @InjectModel(Delivery.name) private deliveryModel//: Model<DeliveryDocument>

  async use(req: Request, res: Response, next: NextFunction) {

    const { receiverId,transmitterId,location } = req.body;
    
    const findDeliveryByPerson = await this.deliveryModel.findOne({receiverId});

    if(!findDeliveryByPerson){
      throw new HttpException('no existe registros de entega de la persona solucitada', 400);
    }

    if(
      findDeliveryByPerson.receiverId != receiverId || 
      findDeliveryByPerson.transmitterId != transmitterId ||
      findDeliveryByPerson.location != location
      ){
        throw new HttpException('los campos de receptor, emisor, ubicacion deben ser los mismos de la entrega', 400);
      }
    

    // throw new HttpException("error",404)
    next();
  }
}
