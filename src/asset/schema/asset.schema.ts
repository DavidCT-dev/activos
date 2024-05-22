import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type AssetDocument = HydratedDocument<Asset>;

@Schema()
export class Asset {
    @Prop({trim:true, uppercase:true})
    name: string; 

    @Prop({trim:true,uppercase:true})
    description: string;
    
    @Prop({ type: mongoose.Schema.Types.Mixed, default:'GUARDIAN' })
    responsible: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' ,required: true})
    supplier:string;  
    
    @Prop({default:null})
    file?:string

    @Prop({ default: false })
    isDeleted?: boolean;  
    
    @Prop()
    ufv3:string // total del precio mas el aumento de la ufv

    @Prop()
    ufv4:string //aumento de la ufv menos el precio
    
    
    @Prop({default:0})
    depreciatedValue: number;

    @Prop({ type: mongoose.Schema.Types.Mixed, ref: 'DepreciationAssetList', required: true})
    typeCategoryAsset: string;  

    @Prop({ type: mongoose.Schema.Types.Mixed, ref: 'State'})
    state: string;

    
    @Prop({ type: 
        { 
            _id:false,
            price: Number, 
            dateAcquisition: Date,
            warrantyExpirationDate:Date,
            lote:Number,
            code: { type: String},
            documentPdf:String,
        }   
    })
    informationCountable: { 
        price: number; 
        dateAcquisition: Date; 
        warrantyExpirationDate: Date;
        lote:number
        code:string
        documentPdf:string;

    };

    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    location: string;

    @Prop({ type: Date, default: Date.now })
    createdAt: Date
    
    @Prop({ default: false })
    assigned?: boolean;  

    @Prop()
    idUser: string;  
}


export const AssetSchema = SchemaFactory.createForClass(Asset);



