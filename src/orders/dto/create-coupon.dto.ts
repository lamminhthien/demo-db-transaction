import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateCouponDto {
  @ApiPropertyOptional({
    description: 'Coupon discount percent. Defaults to 10 when omitted.',
    minimum: 0,
    maximum: 100,
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;
}
