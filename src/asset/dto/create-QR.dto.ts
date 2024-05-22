import { ApiProperty } from "@nestjs/swagger";

export class CreateQRDto {
    @ApiProperty()
    QR: string[];
}