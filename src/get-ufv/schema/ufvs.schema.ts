
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UfvDocument = HydratedDocument<Ufv>;

@Schema()
export class Ufv {
    @Prop()
    fecha: string; 

    @Prop()
    ufv: number;
    
    static DepreciationAssetList: string;
    
    @Prop()
    idUser: string;

}

export const UfvSchema = SchemaFactory.createForClass(Ufv);



