import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    format: 'uuid',
    description: 'Stored parent, which may be hidden publicly',
  })
  parentId!: string | null;
  @ApiProperty() sortOrder!: number;
  @ApiPropertyOptional({ description: 'Admin only' }) isActive?: boolean;
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Admin only' })
  createdAt?: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Admin only' })
  updatedAt?: Date;
}
export class CategoryTreeNodeDto extends CategoryResponseDto {
  @ApiProperty({
    nullable: true,
    type: String,
    format: 'uuid',
    description: 'Parent in this visible tree; null means visible root',
  })
  treeParentId!: string | null;
  @ApiProperty({ type: () => [CategoryTreeNodeDto] }) children!: CategoryTreeNodeDto[];
}
export class CategoryPageDto {
  @ApiProperty({ type: [CategoryResponseDto] }) items!: CategoryResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() hasMore!: boolean;
}
