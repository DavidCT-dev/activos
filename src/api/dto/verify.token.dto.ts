import { ApiProperty } from "@nestjs/swagger";
export class VerifyTokenDTO{
    @ApiProperty()
    app:string;
    @ApiProperty()
    token:string;
}