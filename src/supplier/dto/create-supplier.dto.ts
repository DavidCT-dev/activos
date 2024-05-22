// Importa el decorador ApiProperty de Swagger para documentación.
import { ApiProperty } from "@nestjs/swagger";

// Define un DTO (Data Transfer Object) para la creación de proveedores.
export class CreateSupplierDto {
  // Decorador ApiProperty para especificar la propiedad managerName en la documentación.
  @ApiProperty()
  managerName: string; 

  // Decorador ApiProperty para especificar la propiedad managerCi en la documentación.
  @ApiProperty()
  managerCi: string

  // Decorador ApiProperty para especificar la propiedad managerPhone en la documentación.
  @ApiProperty()
  managerPhone: number

  // Decorador ApiProperty para especificar la propiedad businessAddress en la documentación.
  @ApiProperty()
  businessAddress: string;

  // Decorador ApiProperty para especificar la propiedad email en la documentación.
  @ApiProperty()
  email: string;

  // Decorador ApiProperty para especificar la propiedad businessName en la documentación.
  @ApiProperty()
  businessName: string;

  // Decorador ApiProperty para especificar la propiedad NIT en la documentación.
  @ApiProperty()
  NIT: string;

  // Decorador ApiProperty para especificar la propiedad informationAsset en la documentación.
  @ApiProperty({
    type: Object,
    properties: {
      asset: {type:'string'},
      description:{type:'string'},
    },
  })
  informationAsset: {
    asset: String; 
    description: String;
  };

  // Decorador ApiProperty para especificar la propiedad idUser en la documentación.
  idUser: string;
}