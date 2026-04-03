import { IsString, IsOptional, IsEnum, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ConversationType {
  CHAT = 'chat',
  ANALYSIS = 'analysis',
  CONTRACT = 'contract',
}

export class CreateConversationDto {
  @ApiPropertyOptional({ example: 'legal', description: 'ID del asesor. Default: legal' })
  @IsOptional()
  @IsString()
  advisorId?: string;

  // Alias snake_case para compatibilidad con el frontend
  @ApiPropertyOptional({ example: 'legal' })
  @IsOptional()
  @IsString()
  advisor_id?: string;

  @ApiPropertyOptional({ enum: ConversationType })
  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;

  @ApiPropertyOptional({ example: 'Consulta sobre contrato de alquiler' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ example: 'Tengo una consulta sobre mi contrato de alquiler' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  initial_message?: string;

  @ApiPropertyOptional({ example: 'alquiler' })
  @IsOptional()
  @IsString()
  contract_type?: string;
}

export class SendMessageDto {
  @ApiProperty({ example: '¿Qué necesito para un contrato de alquiler?' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10000)
  content: string;
}

export class AnalyzeDocumentDto {
  @ApiProperty({ example: 'Contrato de Locación' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiProperty({ example: 'Texto completo del contrato...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  content: string;

  @ApiPropertyOptional({ example: 'AR' })
  @IsOptional()
  @IsString()
  country?: string;
}
