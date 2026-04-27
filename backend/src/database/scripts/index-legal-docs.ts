/**
 * TuAsesor — RAG Legal Document Indexer
 * Run: npm run db:index-legal
 */
import 'reflect-metadata';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function indexDocument(docId: string, content: string): Promise<void> {
  // Delete existing embeddings for this document
  await supabase.from('legal_embeddings').delete().eq('document_id', docId);

  const chunks = chunkText(content);
  console.log(`  → Indexando ${chunks.length} chunks...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);

    const { error } = await supabase.from('legal_embeddings').insert({
      document_id: docId,
      chunk_index: i,
      chunk_text: chunk,
      embedding,
      metadata: { chunk_index: i, total_chunks: chunks.length },
    });

    if (error) {
      console.error(`  ✗ Error en chunk ${i}:`, error.message);
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

async function main() {
  console.log('🔍 TuAsesor — Indexador RAG Legal\n');

  const { data: documents, error } = await supabase
    .from('legal_documents')
    .select('id, title, country, category')
    .eq('is_active', true);

  if (error) {
    console.error('Error al obtener documentos:', error.message);
    process.exit(1);
  }

  console.log(`📚 Encontrados ${documents?.length || 0} documentos para indexar\n`);

  for (const doc of documents || []) {
    console.log(`📄 ${doc.title} (${doc.country} — ${doc.category})`);

    const { data: fullDoc } = await supabase
      .from('legal_documents')
      .select('content')
      .eq('id', doc.id)
      .single();

    if (!fullDoc?.content) {
      console.log('  ⚠ Sin contenido, saltando...');
      continue;
    }

    await indexDocument(doc.id, fullDoc.content);
    console.log(`  ✓ Indexado exitosamente\n`);
  }

  console.log('✅ Indexación completada');
}

main().catch(console.error);
