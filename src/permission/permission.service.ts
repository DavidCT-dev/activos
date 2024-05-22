import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Permission, PermissionDocument } from './schema/permission.schema';
import { Model } from 'mongoose';

@Injectable()
export class PermissionService {
  constructor(
    @InjectModel(Permission.name) private readonly permissionModel: Model<PermissionDocument>,
  ){}

  async setPermissionDefault() {
    const count = await this.permissionModel.estimatedDocumentCount();
    if (count > 0) return;
    const values = await Promise.all([
      this.permissionModel.create({ permissionName: 'OBTENER_UFVS_DEL_BCB_ACT' }),
      this.permissionModel.create({ permissionName: 'OBTENER_UFVS_ACT' }),

      this.permissionModel.create({ permissionName: 'VISUALIZAR_BITACORAS_ACT' }),

      this.permissionModel.create({ permissionName: 'CREAR_ACTIVO_ACT' }),
      this.permissionModel.create({ permissionName: 'OBTENER_ACTIVOS_ACT' }),
      this.permissionModel.create({ permissionName: 'EDITAR_ACTIVO_ACT' }),
      this.permissionModel.create({ permissionName: 'ELIMINAR_ACTIVO_ACT' }),
      
      this.permissionModel.create({ permissionName: 'OBTENER_USUARIOS' }),      

      this.permissionModel.create({ permissionName: 'CREAR_GRUPO_CONTABLE_ACT' }),
      this.permissionModel.create({ permissionName: 'OBTENER_GRUPOS_CONTABLES_ACT' }),
      this.permissionModel.create({ permissionName: 'EDITAR_GRUPO_CONTABLE_ACT' }),
      this.permissionModel.create({ permissionName: 'ELIMINAR_GRUPO_CONTABLE_ACT' }),
      
      this.permissionModel.create({ permissionName: 'CREAR_PROVEEDOR_ACT' }),
      this.permissionModel.create({ permissionName: 'OBTENER_PROVEEDORES_ACT' }),
      this.permissionModel.create({ permissionName: 'EDITAR_PROVEEDOR_ACT' }),
      this.permissionModel.create({ permissionName: 'ELIMINAR_PROVEEDOR_ACT' }),
      this.permissionModel.create({ permissionName: 'REESTABLECER_PROVEEDOR_ACT' }),

      this.permissionModel.create({ permissionName: 'CREAR_PERMISO_ACT' }),
      this.permissionModel.create({ permissionName: 'OBTENER_PERMISOS_ACT' }),
      this.permissionModel.create({ permissionName: 'EDITAR_PERMISO_ACT' }),
      this.permissionModel.create({ permissionName: 'ELIMINAR_PERMISO_ACT' }),
    ]);
    return values;
  }

  async create(createPermissionDto: CreatePermissionDto) {
    return await this.permissionModel.create(createPermissionDto) ;
  }

  async findAll() {
    return await this.permissionModel.find();
  }

  async findOne(id: string) {
    return await this.permissionModel.findById(id);
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    return await this.permissionModel.findByIdAndUpdate(id, updatePermissionDto, { new:true });
  }

  async remove(id: string) {
    return await this.permissionModel.findByIdAndDelete(id);
  }
}
