import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { SUPABASE_ADMIN } from '../../config/supabase.module';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly openai: OpenAI;

  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({ apiKey: config.get('OPENAI_API_KEY') });
  }

  async searchKnowledge(query: string, country?: string): Promise<string> {
    try {
      // Generate embedding for query
      const embeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });

      const embedding = embeddingResponse.data[0].embedding;

      // Search by vector similarity
      const { data: vectorResults, error } = await this.supabase.rpc('search_legal_knowledge', {
        query_embedding: embedding,
        match_count: 5,
        filter_country: country || null,
        filter_category: null,
        similarity_threshold: 0.65,
      });

      if (!error && vectorResults && vectorResults.length > 0) {
        return this.formatResults(vectorResults);
      }

      // Fallback: text search
      this.logger.debug('Vector search found no results, trying text search');
      return await this.searchByText(query, country);
    } catch (error) {
      this.logger.warn('RAG search failed, continuing without context', error.message);
      return '';
    }
  }

  private async searchByText(query: string, country?: string): Promise<string> {
    const keywords = query
      .toLowerCase()
      .split(' ')
      .filter((w) => w.length > 3)
      .slice(0, 5);

    if (keywords.length === 0) return await this.getGeneralDocs(country);

    let queryBuilder = this.supabase
      .from('legal_documents')
      .select('title, content, country, category')
      .eq('is_active', true);

    if (country) queryBuilder = queryBuilder.eq('country', country);

    // Build OR filter for keywords
    const orFilter = keywords.map((k) => `content.ilike.%${k}%`).join(',');
    queryBuilder = queryBuilder.or(orFilter).limit(3);

    const { data } = await queryBuilder;

    if (data && data.length > 0) {
      return data
        .map((d) => `**${d.title}** (${d.country}):\n${d.content.substring(0, 800)}`)
        .join('\n\n---\n\n');
    }

    return await this.getGeneralDocs(country);
  }

  private async getGeneralDocs(country?: string): Promise<string> {
    let queryBuilder = this.supabase
      .from('legal_documents')
      .select('title, content, country, category')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(2);

    if (country) queryBuilder = queryBuilder.eq('country', country);

    const { data } = await queryBuilder;

    if (data && data.length > 0) {
      return data
        .map((d) => `**${d.title}** (${d.country}):\n${d.content.substring(0, 600)}`)
        .join('\n\n---\n\n');
    }

    return '';
  }

  private formatResults(results: any[]): string {
    return results
      .map(
        (r) =>
          `**${r.title}** (${r.country} | ${r.category} | similitud: ${(r.similarity * 100).toFixed(0)}%):\n${r.chunk_text}`,
      )
      .join('\n\n---\n\n');
  }
}
