import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SEEDS_DIR = path.resolve(__dirname, '..', 'seeds');

async function seed() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  if (!fs.existsSync(SEEDS_DIR)) {
    console.log('ℹ️  No hay directorio seeds/ — nada que sembrar');
    return;
  }

  const files = fs.readdirSync(SEEDS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('ℹ️  No hay archivos .sql en seeds/');
    return;
  }

  console.log('🌱 Ejecutando seeds...\n');

  for (const filename of files) {
    const filepath = path.join(SEEDS_DIR, filename);
    const sql = fs.readFileSync(filepath, 'utf-8');

    console.log(`📄 Sembrando ${filename}...`);

    const { error } = await supabase.rpc('exec_sql', { query: sql }).single();

    if (error) {
      console.error(`⚠️  Error en ${filename}: ${error.message}`);
      console.log('💡 Ejecutá este archivo manualmente en Supabase SQL Editor');
      continue;
    }

    console.log(`✅ ${filename} sembrado`);
  }

  console.log('\n🎉 Seeds completados');
}

seed().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
