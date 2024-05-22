import { ApiProperty } from '@nestjs/swagger';

export class UpdateDevolutionDto {
  @ApiProperty()
  assetIdNew: string;

  @ApiProperty()
  assetIdOld:string

  @ApiProperty()
  observation:string;

  @ApiProperty()
  transmitterId:string;

  @ApiProperty()
  receiverId:string;

  pdf: string;

  @ApiProperty()
  location:string;

  @ApiProperty()
  stateId:string;

}
