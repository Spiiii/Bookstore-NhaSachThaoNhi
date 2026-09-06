import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ format: 'email', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ writeOnly: true, format: 'password' })
  @IsString()
  @IsByteLength(1, 1024)
  password!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ writeOnly: true, format: 'password' })
  @IsString()
  @IsByteLength(1, 1024)
  currentPassword!: string;

  @ApiProperty({ writeOnly: true, format: 'password', minLength: 15 })
  @IsString()
  @MinLength(15)
  @IsByteLength(1, 1024)
  newPassword!: string;
}

export class AccessTokenDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ enum: ['Bearer'] })
  tokenType!: 'Bearer';
}

export class AdminProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: ['ADMIN'] })
  role!: 'ADMIN';
}
