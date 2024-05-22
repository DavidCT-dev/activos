import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StateDocument = HydratedDocument<State>;
@Schema()
export class State  {
  @Prop({ required: true , uppercase:true, trim:true})
  name: string;

  @Prop({ default:false })
  isDeleted: Boolean;

  @Prop()
  idUser: string;  
}

export const StateSchema = SchemaFactory.createForClass(State);


