import { ApiProperty } from "@nestjs/swagger";

export class CreateDepreciationAssetListDto {
  @ApiProperty()
  assetCategory: string; 
  
  @ApiProperty()
  usefulLife: number;
  
  @ApiProperty()
  subCategory: string; 
  
  idUser: string;
}
