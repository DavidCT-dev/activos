import { HttpException, Injectable } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Supplier, SupplierDocument } from './schema/supplier.schema';
import { FilterQuery, Model } from 'mongoose';
import getConfig from '../config/configuration'
import { Asset, AssetDocument } from 'src/asset/schema/asset.schema';
import { FilterSupplierDto } from './dto/filter.supplier.dto';
import {faker} from '@faker-js/faker'
import { randomInt, randomUUID } from 'crypto';

// Decorador que indica que la clase es un servicio y puede ser inyectada en otros componentes.
@Injectable()
export class SupplierService {
  // Constructor que inyecta modelos y servicios necesarios.
  constructor(    
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,  
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,  
    private httpService: HttpService,
    ){}

    // Método para crear un nuevo proveedor.
    async create(createSupplierDto: CreateSupplierDto) {
      const { managerName, managerCi,managerPhone, businessAddress, email,businessName,NIT,informationAsset} = createSupplierDto
      const{ asset,description } = informationAsset
      // Verifica si ya existe un proveedor con el mismo NIT y managerCi.
      const findSupplierNit = await this.supplierModel.findOne({
        idUser:createSupplierDto.idUser,
        NIT,
        managerCi
      })
      // Crea y guarda el nuevo proveedor.
      return await this.supplierModel.create(createSupplierDto)  
    }
    // Método para obtener todos los proveedores con opciones de filtrado y paginación.
    async findAll(user,params?: FilterSupplierDto) {
      const filters: FilterQuery<Supplier> = { isDeleted: false, idUser:user};
      const { limit =10 , page, nameSupplier,managerCi, managerPhone,NIT,businessAddress,email,businessName} = params;
      if (params) {
      
        if (nameSupplier) {
          filters.managerName= {
            $regex: `^.{3}${nameSupplier.substring(3)}.*`,
            $options: 'i',
          };
        }
        if (managerCi) {
          filters.managerCi= {
            $regex: `^.{3}${managerCi.substring(3)}.*`,
            $options: 'i',
          };
        }
        if(NIT){
          filters.NIT= {
            $regex: `^.{3}${NIT.substring(3)}.*`,
            $options: 'i',
          };
        }   

        if (businessAddress) {
          filters.businessAddress = {
            $regex: `^.{3}${businessAddress.substring(3)}.*`,
            $options: 'i',
          };
        }
        if(email){
          filters.email = {
            $regex: `^.{3}${email.substring(3)}.*`,
            $options: 'i',
          };
        }
        if(businessName){ 
          filters.businessName = {
            $regex: `^.{3}${businessName.substring(3)}.*`,
            $options: 'i',
          };
        } 
        if (managerPhone) {
          filters.managerPhone = (managerPhone);
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
      const countQuery= this.supplierModel.find(filters)
      const totalSupplier = await  this.supplierModel.countDocuments({idUser:user,isDeleted:false});
      const totalSuppliers= await countQuery.countDocuments()
      const totalPages=Math.ceil(totalSuppliers/pageSize)
      const skip=(page - 1)*pageSize || 0;
      const [suppliers] = await Promise.all([
        this.supplierModel
          .find(filters)
          .sort({ _id: -1 })
          .limit(limit)
          .skip(skip) 
          .exec(),
      ]);

      return  {totalSupplier,totalPages,suppliers}
    //   if (suppliers.length > 0) {    
    //     return  {totalSupplier,totalPages,suppliers}
    // } else {
    //   return { message: 'No se encontraron proveedores que coincidan con la búsqueda.' };
    // }
      
  }

  // Método para obtener un proveedor por su ID.
  async findOne(id: string) {
    const findSupplier = await this.supplierModel.findOne({_id:id})
    if(!findSupplier){
      throw new HttpException('no se encontro al proveedor',404)
    }
    return await this.supplierModel.findById(id)
  }

  // Método para actualizar un proveedor por su ID.
  async update(id: string, updateSupplierDto) {
    const findSupplier = await this.supplierModel.findOne({_id:id})
    if(!findSupplier){
      throw new HttpException('no se encontro al proveedor',404)
    }
    return await this.supplierModel.findByIdAndUpdate(id,updateSupplierDto,{new:true});
  }

  // Método para "darbaja" un proveedor cambiando el estado de isDeleted a true.
  async remove(id: string) {
    const findSupplier = await this.supplierModel.findOne({_id:id})
    if(!findSupplier){
      throw new HttpException('no se encontro al proveedor',404)
    }
    findSupplier.isDeleted= true
    return findSupplier.save();
  }
  // Método para restablecer el estado de isDeleted a false.
  async restartsupplier(id:string){
    const restartSupplier = await this.supplierModel.findOne({ _id: id })
    if (!restartSupplier) {
      throw new HttpException('la aplicacion no existe',404)
    }
    if (restartSupplier.isDeleted==false) {
      throw new HttpException('el proveedor no esta eliminado',409)
    }
    restartSupplier.isDeleted = false 
    return restartSupplier.save()
  }
  
  // Método para generar datos aleatorios de proveedores (para pruebas).
  async  generarDatosProveedor(){
    const number=10
    for (let i = 0; i < number; i++) {
        const datosProveedor = {
            managerName: faker.name.fullName(),
            managerCi: randomInt(1000000,9999999999) ,
            managerPhone: randomInt(10000000,99999999),
            businessAddress: faker.address.streetAddress(),
            isDeleted: false,
            email: faker.internet.email(),
            businessName: faker.company.name(),
            NIT: randomUUID(),
            asset: faker.lorem.word(),
            description: faker.lorem.sentence(),
            
            idUser:"655dff9f2871747a7de9e567",
          };
          const documentoProveedor = await this.supplierModel.create(datosProveedor);
          documentoProveedor.save()
    }
}
}
