import { ApiProperty } from '@nestjs/swagger';

export class DashboardSectionDto {
  @ApiProperty() total!: number;
  @ApiProperty() active!: number;
}

export class DashboardProductsDto extends DashboardSectionDto {
  @ApiProperty() missingImages!: number;
}

export class DashboardNewsDto {
  @ApiProperty() total!: number;
  @ApiProperty() published!: number;
  @ApiProperty() draft!: number;
  @ApiProperty() archived!: number;
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardProductsDto }) products!: DashboardProductsDto;
  @ApiProperty({ type: DashboardSectionDto }) categories!: DashboardSectionDto;
  @ApiProperty({ type: DashboardSectionDto }) brands!: DashboardSectionDto;
  @ApiProperty({ type: DashboardNewsDto }) news!: DashboardNewsDto;
  @ApiProperty({ type: DashboardSectionDto }) banners!: DashboardSectionDto;
  @ApiProperty({ type: String, format: 'date-time' }) generatedAt!: string;
}
