import { ApiProperty } from "@nestjs/swagger";

export class CreateReportDto {
  @ApiProperty({ type: 'string', format: 'date' })
  dateInitial: string; 

  @ApiProperty({ type: 'string', format: 'date' })
  dateCurrent: string; 
}
