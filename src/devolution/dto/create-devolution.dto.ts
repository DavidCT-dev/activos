import { ApiProperty } from "@nestjs/swagger";

export class CreateDevolutionDto {
  @ApiProperty()
  assetIds: string[];
  
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

  idUser: string;

}
