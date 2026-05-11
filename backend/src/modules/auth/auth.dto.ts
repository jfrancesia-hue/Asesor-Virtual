import { IsEmail, IsString, MinLength, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: 'juan@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'Mi Empresa S.A.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional({ example: 'AR', default: 'AR' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: '2026-04',
    description: 'Versión de los Términos y Condiciones que el usuario aceptó al registrarse.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  acceptedTermsVersion?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'juan@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'juan@empresa.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Access token recibido en el fragmento URL del email de recuperación' })
  @IsString()
  @MinLength(10)
  accessToken: string;

  @ApiProperty({ example: 'NuevaPass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
