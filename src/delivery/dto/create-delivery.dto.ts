import { ApiProperty } from "@nestjs/swagger";

export class CreateDeliveryDto {
  @ApiProperty()
  assetIds: string[]

  // @ApiProperty()
  // assetId: string;

  @ApiProperty()
  observation: string;

  @ApiProperty()
  transmitterId:string;

  @ApiProperty()
  receiverId:string;

  @ApiProperty()
  location:string;

  // @ApiProperty()
  // stateId:string;

  // @ApiProperty()
  pdf: string;

  idUser: string;

}
