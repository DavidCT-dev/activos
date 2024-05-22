// Importa las decoraciones Prop, Schema y SchemaFactory de la biblioteca '@nestjs/mongoose'.
// También importa mongoose y el tipo HydratedDocument desde 'mongoose'.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

// Define el tipo SupplierDocument que se utiliza para representar documentos mongoose hydratados de la clase Supplier.
export type SupplierDocument = HydratedDocument<Supplier>;

// Decorador @Schema para marcar la clase Supplier como un esquema mongoose.
@Schema()
export class Supplier {
    // Decorador @Prop para especificar propiedades mongoose en la clase.

    // Nombre del gerente del proveedor, con opciones de recortar espacios en blanco y convertir a mayúsculas.
    @Prop({ trim: true, uppercase: true })
    managerName: string;

    // Número de identificación del gerente del proveedor, con opciones de recortar espacios en blanco y convertir a mayúsculas.
    @Prop({ trim: true, uppercase: true })
    managerCi: string;

    // Número de teléfono del gerente del proveedor, con opciones de recortar espacios en blanco y convertir a mayúsculas.
    @Prop({ trim: true, uppercase: true })
    managerPhone: number;

    // Dirección comercial del proveedor, con opciones de recortar espacios en blanco y convertir a mayúsculas.
    @Prop({ trim: true, uppercase: true })
    businessAddress: string;

    // Indica si el proveedor ha sido eliminado, con un valor predeterminado de falso.
    @Prop({ default: false })
    isDeleted: boolean;

    // Correo electrónico del proveedor, con opciones de recortar espacios en blanco y convertir a mayúsculas.
    @Prop({ trim: true, uppercase: true })
    email: string;

    // Nombre comercial de la empresa proveedora, con opciones de recortar espacios en blanco.
    @Prop({ trim: true })
    businessName: string;

    // Número de Identificación Tributaria del proveedor, con opciones de recortar espacios en blanco y convertir a mayúsculas.
    @Prop({ trim: true, uppercase: true })
    NIT: string;

    // Propiedad informationAsset que es un array de objetos con propiedades asset y description, cada una con opciones de recortar espacios en blanco y convertir a mayúsculas.
    @Prop([{
        type: {
            _id: false,
            asset: { type: String, trim: true, uppercase: true },
            description: { type: String, trim: true, uppercase: true },
        }
    }])
    informationAsset: Array<{
        asset: String;
        description: String;
    }>;

    // Propiedad idUser que se utiliza para almacenar la identificación del usuario.
    @Prop()
    idUser: string;
}

// Crea el esquema mongoose para la clase Supplier utilizando SchemaFactory.
export const SupplierSchema = SchemaFactory.createForClass(Supplier);


