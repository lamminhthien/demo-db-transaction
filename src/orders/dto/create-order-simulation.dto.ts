import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateOrderDto {
  @ApiProperty({ example: 'John Doe', description: 'Customer display name' })
  @IsString()
  customerName!: string;
}

class CreateOrderItemDto {
  @ApiProperty({ example: 'SKU-IPHONE-15', description: 'Stock keeping unit' })
  @IsString()
  sku!: string;

  @ApiProperty({ minimum: 1, example: 2 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ minimum: 0, example: 499.99 })
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

class SimulationOptionsDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Force an error after flush to simulate rollback',
  })
  @IsOptional()
  @IsBoolean()
  shouldFail?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Flush changes but intentionally skip commit',
  })
  @IsOptional()
  @IsBoolean()
  noCommit?: boolean;
}

export class CreateOrderSimulationDto {
  @ApiProperty({ type: () => CreateOrderDto })
  @ValidateNested()
  @Type(() => CreateOrderDto)
  order!: CreateOrderDto;

  @ApiProperty({ type: () => [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiPropertyOptional({
    example: 'SUMMER10',
    description: 'Optional coupon code to apply discount usage logic',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ type: () => SimulationOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SimulationOptionsDto)
  simulation?: SimulationOptionsDto;
}
