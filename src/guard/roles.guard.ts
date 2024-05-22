import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from './constants/permission';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PermissionDocument, Permission as PermissionSchema} from 'src/permission/schema/permission.schema';
import getConfig from '../config/configuration'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private httpService:HttpService,
    @InjectModel(PermissionSchema.name) private readonly permissionModel: Model<PermissionDocument>,
    ) {}

  async canActivate(context: ExecutionContext){
    
    const requiredPermission = this.reflector.getAllAndOverride<Permission[]>('permissions', [ context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      return true;
    }
  
    const request = context.switchToHttp().getRequest();       
    const token = request.token
    if (!token) {
      throw new UnauthorizedException('No autorizado, no existe token');
    }

    let userPermission
    
    try {
      const decodedToken = await this.httpService.post(`${getConfig().verify_token}auth/decoded`,{token}).toPromise() 
      
      if(decodedToken.data.roles.length == 0){
        throw new HttpException('usurio sin roles',HttpStatus.UNAUTHORIZED)
      }

      const rolesWithDetails = await Promise.all(decodedToken.data.roles.map(roleId =>this.httpService.get(`${getConfig().verify_token}rol/${roleId}`).toPromise()
      ));
      
      //const roleDetails = rolesWithDetails.map(response => response.data.userPermission);
      const roleDetails = rolesWithDetails.map(response => response.data.permissionName).flat();
     
// verificar
      userPermission = roleDetails.map((index) => index.permissionName).filter((item)=>item != undefined).flat()
     
    } catch (error) {
      
      if(error instanceof HttpException){
        throw error
      }
      throw error.response?.data
    }
  
    // const filteredRoles = userPermission.filter(role => role.startsWith("ACTIVO"));
  
  const permissionTrue = await userPermission.filter(index => index == requiredPermission[0])

    if(permissionTrue.length > 0 ){
      return true;
    } 

    throw new UnauthorizedException('No tienes permisos para ejecutar esta acción');
  }

}