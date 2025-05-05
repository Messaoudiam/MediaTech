import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCopyDto {
  @ApiProperty({
    description: 'ID de la ressource à laquelle cet exemplaire appartient',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @ApiProperty({
    description: "État de l'exemplaire",
    example: 'Neuf',
    default: 'Bon état',
  })
  @IsString()
  @IsOptional()
  condition?: string = 'Bon état';

  @ApiProperty({
    description: "Disponibilité de l'exemplaire",
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  available?: boolean = true;
}
