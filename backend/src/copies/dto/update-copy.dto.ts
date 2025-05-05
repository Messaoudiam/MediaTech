import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateCopyDto {
  @ApiProperty({
    description: "État de l'exemplaire",
    example: 'Usé',
    required: false,
  })
  @IsString()
  @IsOptional()
  condition?: string;

  @ApiProperty({
    description: "Disponibilité de l'exemplaire",
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  available?: boolean;
}
