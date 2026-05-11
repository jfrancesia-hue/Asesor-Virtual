import { IsEmail, IsString, MinLength, IsOptional, MaxLength, Matches } from 'class-validator';
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

  @ApiProperty({
    example: 'Password123',
    minLength: 8,
    description: 'Mínimo 8 caracteres con al menos una mayúscula, una minúscula y un número.',
  })
  @IsString()
  @MinLength(8)
  @Matches(/[a-z]/, { message: 'La contraseña debe incluir al menos una letra minúscula' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe incluir al menos una letra mayúscula' })
  @Matches(/[0-9]/, { message: 'La contraseña debe incluir al menos un número' })
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

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(8)
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

  @ApiProperty({
    example: 'NuevaPass123',
    minLength: 8,
    description: 'Mínimo 8 caracteres con al menos una mayúscula, una minúscula y un número.',
  })
  @IsString()
  @MinLength(8)
  @Matches(/[a-z]/, { message: 'La contraseña debe incluir al menos una letra minúscula' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe incluir al menos una letra mayúscula' })
  @Matches(/[0-9]/, { message: 'La contraseña debe incluir al menos un número' })
  newPassword: string;
}
