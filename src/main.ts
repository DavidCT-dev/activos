import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import getConfig from './config/configuration'
import { DepreciationAssetListService } from './depreciation-asset-list/depreciation-asset-list.service'
import { json } from 'express';
import {DepreciationService} from './asset/depreciation.service'
import {GetUfvService} from './get-ufv/get-ufv.service'
import { PermissionService } from './permission/permission.service'
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  
  app.use(json({ limit: '10mb' }));
  
  // app.enableCors({
  //   origin:'http:10.10.214.218:3000',
  // }) //solo la ruta http:localhost:3000 tiene permiso para realizar las peticiones http

  const groupCountable= app.get(DepreciationAssetListService)
  groupCountable.setDataDefault()

  const permission = app.get(PermissionService)
  permission.setPermissionDefault()

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('activo')
    .setDescription('Activo API description')
    .setVersion('1.0')
    .addTag('apiAuth', "verifica que el token y la aplicaciones sean correctas redireccionando al microservicio de seguridad")
    .addTag('get-ufv-from-bcb', "realizar peticiones de valor de Unidades de Fomento a la Vivienda a la pagina del Banco Central de Bolivia")
    .addTag('bitacora', "registro de las acciones realizadas en el sistema")
    .addTag('asset',"endpoints relacionados con la creación de un activo")
    .addTag('reports', "endpoints que calcula la depresiacion de activos")
    .addTag('delivery', "endpoints relacionados con la entrega de un activo a un funcionario")
    .addTag('devolution', "endpoints relacionados con la devolucion de un activo por parte de un funcionario")
    .addTag('personals', "endpoint relacionado con la obtencion de los usuarios")
    .addTag('organigrama', "endpoint relacionado con la obtencion del organigrama")
    .addTag('accounting-groups', "endpoints relacionados con la creacion de grupos contables")
    .addTag('supplier', "endpoints relacionados con la creacion de proveedores")
    .addTag('state', "endpoints relacionados con los estados de un activo")
    .addTag('permission')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document,{
    swaggerOptions:{
      filter:true,
      showRequestDuration: true,
    }
  });

  await app.listen(getConfig().port);
}
bootstrap();
