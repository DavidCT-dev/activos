import { ApiProperty } from "@nestjs/swagger";

export class CreateAssetDto {

    @ApiProperty()
    name: string; 
    
    @ApiProperty()
    description: string;
    
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
        // documentPdf: { type: 'string' },
        lote: { type: 'number' },
        // code: { type: 'string' },
      },
    })
    informationCountable: {
      price: number;
      dateAcquisition: Date;
      warrantyExpirationDate: Date;
      // documentPdf: string;
      lote: number;
      // code: string;
    };

    @ApiProperty()
    location: string;

    idUser: string;
    
}
