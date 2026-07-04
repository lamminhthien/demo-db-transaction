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

class CreateOrderDto {
  @IsString()
  customerName!: string;
}

class CreateOrderItemDto {
  @IsString()
  sku!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

class SimulationOptionsDto {
  @IsOptional()
  @IsBoolean()
  shouldFail?: boolean;

  @IsOptional()
  @IsBoolean()
  noCommit?: boolean;
}

export class CreateOrderSimulationDto {
  @ValidateNested()
  @Type(() => CreateOrderDto)
  order!: CreateOrderDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsString()
  couponCode!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SimulationOptionsDto)
  simulation?: SimulationOptionsDto;
}
