import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { VerifyTokenDTO } from './dto/verify.token.dto';
import getConfig from '../config/configuration'
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';

// @ApiBearerAuth()
@ApiTags('apiAuth')
@Controller('api')
export class ApiController {
    constructor(
       private readonly httpService:HttpService, 
    ){}
	
	// @UseInterceptors(LoggerInterceptor)
	@Post('/redirect-to-main')
	async verifyToken(@Body() tokenObject:VerifyTokenDTO){
		try {
			const {app, token} = tokenObject
			const response = await this.httpService.post(`${getConfig().verify_token}auth/verify-app-token`,tokenObject).toPromise();		
			return(response.data)
		} catch (error) {
			throw error.response?.data;
		}	
		
	}
}