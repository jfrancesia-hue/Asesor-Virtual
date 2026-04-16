import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

const MIGRATION_ORDER = [
  '000_supabase_rls_setup.sql',
  '001_initial_schema.sql',
  '002_multi_advisor.sql',
  '003_advisor_tools.sql',
];

async function migrate() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  console.log('🚀 Ejecutando migraciones...\n');

  for (const filename of MIGRATION_ORDER) {
    const filepath = path.join(MIGRATIONS_DIR, filename);

    if (!fs.existsSync(filepath)) {
      console.error(`❌ Archivo no encontrado: ${filename}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filepath, 'utf-8');
    console.log(`📄 Ejecutando ${filename}...`);

    const { error } = await supabase.rpc('exec_sql', { query: sql }).single();

    if (error) {
      // Fallback: try running via REST if exec_sql RPC doesn't exist
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (!res.ok) {
        console.error(`❌ Error en ${filename}:`, error.message);
        console.log('💡 Ejecutá este archivo manualmente en Supabase SQL Editor');
        continue;
      }
    }

    console.log(`✅ ${filename} ejecutado`);
  }

  console.log('\n🎉 Migraciones completadas');
}

migrate().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
