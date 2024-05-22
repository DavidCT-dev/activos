export class FilterDeliveryDto {
    // @IsOptional()
    // @IsPositive()
    limit: number;
  
    // @IsOptional()
    page: number;
  
    // @IsOptional()
    positionOfficial: string;
  
    // @IsOptional()
    location: string;

   // @IsOptional()
    transmitterId:string;
  
    // @IsOptional()
    receiverId:string;
  }