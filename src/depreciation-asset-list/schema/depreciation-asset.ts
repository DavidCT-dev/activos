import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type DepreciationAssetListDocument = HydratedDocument<DepreciationAssetList>;

@Schema()
export class DepreciationAssetList {
    @Prop({require:true,trim:true,uppercase:true})
    assetCategory: string; 
    
    @Prop({require:true,trim:true,uppercase:true})
    usefulLife: number;

    @Prop({ default: false,trim:true})
    isDeleted?: boolean;
    
    @Prop({trim:true,uppercase:true})
    subCategory?:string

    @Prop()
    idUser: string;

}

export const DepreciationAssetListSchema = SchemaFactory.createForClass(DepreciationAssetList);



