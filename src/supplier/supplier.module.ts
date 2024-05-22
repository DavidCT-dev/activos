import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Supplier, SupplierSchema } from './schema/supplier.schema';
import { Asset, AssetSchema } from 'src/asset/schema/asset.schema';
import { Ufv, UfvSchema } from 'src/get-ufv/schema/ufvs.schema';
import { SupplierMiddleware } from 'src/middleware/middleware.supplier';
import { Permission, PermissionSchema } from 'src/permission/schema/permission.schema';
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';

// Define el módulo para proveedores.
@Module({
  // Importa los esquemas mongoose en el módulo.
  imports: [
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
      { name: Asset.name, schema: AssetSchema },
      { name:Permission.name, schema:PermissionSchema },
      {name:Bitacora.name, schema:BitacoraSchema}
    ]),
    // Importa el módulo HttpModule para manejar solicitudes HTTP.
    HttpModule,
  ],
  controllers: [SupplierController],
  providers: [SupplierService],
})
export class SupplierModule {
   // Configura el middleware para aplicarlo a rutas específicas.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SupplierMiddleware)
      .forRoutes(
        // Aplica el middleware a la ruta '/supplier' con el método POST.
        { path: '/supplier', method: RequestMethod.POST },
        // { path: '/supplier/update/:id', method: RequestMethod.PUT },
      );
  }
}
