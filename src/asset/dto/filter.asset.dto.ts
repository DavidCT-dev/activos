
export class FilterAssetDto {
  // @IsOptional()
  page: number;

  // @IsPositive()
  limit: number;

  // @IsOptional()
  nameAsset: string;

  // @IsOptional()
  state: string;

  location: string;

  code:String;

  responsible?: string;

  typeCategoryAsset:String
}
