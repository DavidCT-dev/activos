import { ApiProperty } from "@nestjs/swagger";

export class ReadCodeQRDto {
    @ApiProperty()
    code: string;
}