import { ApiProperty } from "@nestjs/swagger";

export class FindUfvDto {
  @ApiProperty({ type: 'string', format: 'date' })
  dateFromUFV: string; 
}
