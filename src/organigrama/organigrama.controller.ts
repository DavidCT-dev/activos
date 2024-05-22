import { HttpService } from '@nestjs/axios';
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import getConfig from '../config/configuration'
import { ApiTags } from '@nestjs/swagger';
@ApiTags('organigrama')
@Controller('organigrama')
export class OrganigramaController {
  constructor(private httpService:HttpService ) {}
  @Get()
   @Get()
  async findAll() {
    const response = await this.httpService.get(`${getConfig().api_organigrama}departments/departments`).toPromise();
    let data =[]
    for(const dataOrganigrama of response.data){
      data.push({
        _id:dataOrganigrama._id,
        Name: dataOrganigrama.name,
      })
    }
    return data
  }
}
