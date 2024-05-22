import { ApiProperty } from "@nestjs/swagger";

export class UpdateDeliveryDto {
  
  @ApiProperty()
  assetIdNew: string;

  @ApiProperty()
  assetIdOld:string

  @ApiProperty()
  observation: string;
  
  @ApiProperty()
  transmitterId:string;
  
  @ApiProperty()
  receiverId:string;
  
  // @ApiProperty()
  pdf: string;

  @ApiProperty()
  location:string;
  
  @ApiProperty()
  stateId:string;
}
