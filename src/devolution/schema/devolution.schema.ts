import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';


export type DevolutionDocument = HydratedDocument<Devolution>;

@Schema({timestamps:true})
export class Devolution {

    @Prop([{ type: 
        { 
            _id:false,
            assetId:{type: mongoose.Schema.Types.Mixed, ref: 'Asset'},
            date: { type: Date, default:new Date(Date.now() - 4 * 60 * 60 * 1000) 
            },
            observation:{type:String, trim:true, uppercase:true},
            state:{type: mongoose.Schema.Types.Mixed, ref: 'State'}
        }   
    }])
    asset: Array<{ 
        assetId: string; 
        date?: Date, 
        observation:String 
        state:String
    }>

    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    receiverId:string;

    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    transmitterId:string;

    @Prop()
    pdf: string;

    @Prop()
    location:string; //peticion a organigrama

    
    @Prop({default:false})
    isDeleted?:boolean

    @Prop()
    idUser: string;
}

export const DevolutionSchema = SchemaFactory.createForClass(Devolution);
