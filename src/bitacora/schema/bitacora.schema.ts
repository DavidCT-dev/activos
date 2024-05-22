import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BitacoraDocument = HydratedDocument<Bitacora>;

@Schema({timestamps:true})
export class Bitacora {
    @Prop({require:true})
    userId: string; 

    @Prop({require:true})
    userEmail: string; 
    
    @Prop({require:true})
    action: string;

    @Prop({ required:true })
    description: string; 

    @Prop({ required:true })
    path: string;  

    @Prop({required:true})
    timestamp:string 
}

export const BitacoraSchema = SchemaFactory.createForClass(Bitacora);

