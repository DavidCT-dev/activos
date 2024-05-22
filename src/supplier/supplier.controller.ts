import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Res, HttpException, UseInterceptors, Query, Req, UseGuards } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LoggerInterceptor } from 'src/interceptors/loggerInterceptors';
import { FilterSupplierDto } from './dto/filter.supplier.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Permissions } from '../guard/decorators/permissions.decorator'
import { Permission } from 'src/guard/constants/permission';
import { RolesGuard } from 'src/guard/roles.guard';

// Decorador de clase que define el nombre de la etiqueta para Swagger y autenticación Bearer para el controlador.
@ApiTags('supplier')
@ApiBearerAuth()
@Controller('supplier')
export class SupplierController {
  // Constructor que inyecta el servicio SupplierService en el controlador.
  constructor(private readonly supplierService: SupplierService) {}

  // Endpoint POST para la creación de un proveedor.
  @Permissions(Permission.ACTIVO_CREAR_PROVEEDOR_ACT)
  @UseInterceptors(LoggerInterceptor)
  @Post()
  async create(@Req() req: Request, @Body() createSupplierDto: CreateSupplierDto) {
    // Asigna la identificación del usuario actual al DTO antes de crear el proveedor.
    createSupplierDto.idUser = req.user.toString();
    return await this.supplierService.create(createSupplierDto);
  }

  // Endpoints GET para la obtención de proveedores, con parámetros opcionales para filtrar la búsqueda.
  @ApiQuery({ name: 'nameSupplier', description: 'ingrese el nombre por el cual desea filtrar al proveedor', required: false })
  @ApiQuery({ name: 'managerCi', description: 'ingrese el ci por el cual desea filtrar al proveedor', required: false })
  @ApiQuery({ name: 'managerPhone', type: Number, description: 'ingrese el numero de celular por el cual desea filtrar al proveedor', required: false })
  @ApiQuery({ name: 'NIT', description: 'ingrese el nit por el cual desea filtrar al proveedor', required: false })
  @ApiQuery({ name: 'businessAddress', description: 'ingrese la dirección de Negocios por el cual desea filtrar al proveedor ', required: false })
  @ApiQuery({ name: 'email', description: 'ingrese el correo electrónico por el cual desea filtrar al proveedor', required: false })
  @ApiQuery({ name: 'businessName', description: 'ingrese el nombre del comercial por el cual desea filtrar al proveedor', required: false })

  @ApiQuery({ name: 'limit', description: 'ingrese la cantidad de proveedores a visualizar', required: false})
  @ApiQuery({ name: 'page', description: 'ingrese el nuemero de pagina ala que quiere ingresar ', required: false }) 

  @Permissions(Permission.ACTIVO_OBTENER_PROVEEDORES_ACT)
  @UseInterceptors(LoggerInterceptor)
  // Endpoint GET para obtener todos los proveedores.
  @Get()
  async findAll(@Req() req :Request,@Query() params?:FilterSupplierDto) {
    // Obtiene el usuario actual del request y luego llama al servicio para obtener proveedores.
    const user =req.user
    const data = await this.supplierService.findAll(user,params);
    return data
  }

  // Endpoint GET para obtener un proveedor por su ID.
  @Get('/:id')
  async findOne(@Param('id') id: string) {
      return await this.supplierService.findOne(id);
  }

  @Permissions(Permission.ACTIVO_EDITAR_PROVEEDOR_ACT)
  @UseInterceptors(LoggerInterceptor)
  // Endpoint PUT para actualizar un proveedor por su ID.
  @Put('update/:id')
  async update(@Param('id') id: string, @Body() updateSupplierDto: CreateSupplierDto) {
    return await this.supplierService.update(id, updateSupplierDto);
  }

  @Permissions(Permission.ACTIVO_ELIMINAR_PROVEEDOR_ACT)
  @UseInterceptors(LoggerInterceptor)
  // Endpoint DELETE para darbaja un proveedor por su ID.
  @Delete(':id')
  async remove(@Param('id') id: string,) {
    return await this.supplierService.remove(id);
  }

  @Permissions(Permission.ACTIVO_REESTABLECER_PROVEEDOR_ACT)
  @UseInterceptors(LoggerInterceptor)
    // Endpoint PUT para restablecer un proveedor por su ID.
  @Put('restart-supplier/:id')
  async restartSupplier(@Param('id') id: string) {
     return await this.supplierService.restartsupplier(id);
  }
  // Endpoint POST para generar datos aleatorios de proveedores (para propósitos de prueba, por ejemplo).
  @Post('/generate')
  @Post('/generate')
  async PostRandom(){
    return await this.supplierService.generarDatosProveedor();
  }
}
