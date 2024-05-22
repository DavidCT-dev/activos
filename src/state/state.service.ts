import { HttpException, Injectable } from '@nestjs/common';
import { CreateStateDto } from './dto/create-state.dto';
import { InjectModel } from '@nestjs/mongoose';
import { State, StateDocument } from './schema/state.schema';
import { FilterQuery, Model } from 'mongoose';
import { Asset, AssetDocument } from 'src/asset/schema/asset.schema';
import { FilterStateDto } from './dto/filter.statedto';

@Injectable()
export class StateService {
  constructor(    
      @InjectModel(State.name) private stateModel: Model<StateDocument>,   
      @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,  
    ){}
    async create(createStateDto: CreateStateDto) {
      const similarState= await this.stateModel.findOne({
        idUser:createStateDto.idUser,
        name:new RegExp(createStateDto.name,'i')
      });
      if (similarState){
        throw new HttpException('Ya existe una estado similar o idéntica.',409);
      }
        return await this.stateModel.create(createStateDto);
    }

  async findAll(user,params?:FilterStateDto) {
    const filters: FilterQuery<State> = { 
      isDeleted: false, 
      idUser:user
    };
    const { nameState,limit =10, page, } = params;
    if (params) {
      if (nameState) {
       
        filters.name= {
          $regex: `^.{3}${nameState.substring(3)}.*`,
          $options: 'i',
        };
        
      }
    }
    if (limit<=0){
      throw new HttpException(
        'El valor de la cantidad de paginas no es válido. Debe ser mayor que 0.',
        400,
      );
    }
    if (page<=0){
      throw new HttpException(
        'El valor de la página no es válido. Debe ser mayor que 0.',
        400,
      );
    }
    const pageSize= limit ;
    const countQuery= this.stateModel.find(filters)
    const totalState = await  this.stateModel.countDocuments({
      idUser:user,isDeleted:false
    });
    const totalStates= await countQuery.countDocuments()
    const totalPages=Math.ceil(totalStates/pageSize)
    const skip=(page - 1)*pageSize || 0;
    const [State] = await Promise.all([
      this.stateModel
        .find(filters)
        .sort({ _id: -1 })
        .limit(limit)
        .skip(skip) 
        .exec(),
    ]);
    if (State.length > 0) {    
      return {totalState,totalPages,State};
    } else {
      return { message: 'No se encontraron estados que coincidan con la búsqueda.' };
    }
  }

  async findOne(id: string) {
    const findState = await this.stateModel.findOne({_id:id})
    if(!findState){
      throw new HttpException('no se encontro el estado ',404)
    }
    return await this.stateModel.findById(id)

  }

  async update(id: string, updateStateDto) {
    const findState = await this.stateModel.findOne({_id:id})
    if(!findState){
      throw new HttpException('no se encontro al estado',404)
    }
    return await this.stateModel.findByIdAndUpdate(id,updateStateDto,{new:true});
  }  

  async remove(id: string) {
    const findState = await this.stateModel.findOne({_id:id})
    if(!findState){
      throw new HttpException('no se encontro al estado',404)
    }
    findState.isDeleted= true
    return findState.save();
  }

  async restartState(id:string){
    const restartState = await this.stateModel.findOne({ _id: id })
    if (!restartState) {
      throw new HttpException('la aplicacion no existe',404)
    }
    if (restartState.isDeleted==false) {
      throw new HttpException('el estado no esta eliminado',409)
    }
    restartState.isDeleted = false 
    return restartState.save()
  }
}
