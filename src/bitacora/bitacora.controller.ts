import { Controller, Get, Req } from '@nestjs/common';
import { BitacoraService } from './bitacora.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
@ApiBearerAuth()
@ApiTags('bitacora')
@Controller('bitacora')
export class BitacoraController {
  constructor(private readonly bitacoraService: BitacoraService) {}

  
  @Get('/bitacora')
  async getBitacora(@Req() req :Request){
    const user =req.user.toString()
    const bitacora =await this.bitacoraService.getAllBitacora(user)
    return bitacora
  }
  @Get('/bitacora-asset')
  async getBitacoraAsset(@Req() req :Request){
    const user =req.user.toString()
    const bitacora =await this.bitacoraService.getAllBitacoraAsset(user)
    return bitacora
  }
}
