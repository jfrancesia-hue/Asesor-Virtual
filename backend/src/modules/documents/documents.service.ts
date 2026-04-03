import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

// Import at module level with try/catch for environments without native bindings
let pdfParse: any;
try {
  pdfParse = require('pdf-parse');
} catch {
  pdfParse = null;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(@Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient) {}

  async uploadAndExtract(file: Express.Multer.File, tenantId: string): Promise<{ text: string; fileName: string }> {
    if (!file) throw new BadRequestException('No se recibió archivo');

    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se aceptan archivos PDF o TXT');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo no puede superar 10MB');
    }

    // Sanitize filename
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFileName = `${tenantId}/${uuidv4()}${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await this.supabase.storage
      .from('documents')
      .upload(safeFileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      this.logger.warn('Storage upload failed, continuing with text extraction only');
    }

    // Extract text
    let extractedText = '';

    if (file.mimetype === 'application/pdf' && pdfParse) {
      try {
        const pdfData = await pdfParse(file.buffer);
        extractedText = pdfData.text || '';
      } catch (error) {
        this.logger.warn('PDF parse failed', error.message);
        throw new BadRequestException('No se pudo leer el PDF. Verificá que no esté protegido.');
      }
    } else if (file.mimetype === 'text/plain') {
      extractedText = file.buffer.toString('utf-8');
    }

    if (!extractedText.trim()) {
      throw new BadRequestException('No se pudo extraer texto del documento. El PDF puede estar protegido o ser solo imágenes.');
    }

    return {
      text: extractedText.substring(0, 15000), // Limit for AI processing
      fileName: file.originalname,
    };
  }
}
