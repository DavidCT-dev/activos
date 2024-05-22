import { ApiProperty } from "@nestjs/swagger";

export class CreateGetUfvDto {
  @ApiProperty({ type: 'string', format: 'date' })
  dateInitial: string; 

  @ApiProperty({ type: 'string', format: 'date' })
  dateCurrent: string; 

  idUser: string;
}
