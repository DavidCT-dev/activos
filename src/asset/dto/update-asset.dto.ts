import { ApiProperty } from "@nestjs/swagger";

export class UpdateAssetDto {
    @ApiProperty()
    assetIds: string[]

    @ApiProperty()
    name: string; 
    
    @ApiProperty()
    description: string;

    // @ApiProperty()
    // responsible:string; 
    
    @ApiProperty()
    supplier:string; 

    @ApiProperty()
    state: string;

    @ApiProperty()
    file?: string

    ufv3:string
    ufv4:string

    ValueUpdate:number
    
    @ApiProperty()
    typeCategoryAsset: string;
    
    @ApiProperty({
      type: Object,
      properties: {
        price: { type: 'number' },
        dateAcquisition: { type: 'string', format: 'date' },
        warrantyExpirationDate: { type: 'string', format: 'date' },
       
      },
    })
    informationCountable: {
      price: number;
      dateAcquisition: Date;
      warrantyExpirationDate: Date;
    
    };

    @ApiProperty()
    location: string; 
     

}
