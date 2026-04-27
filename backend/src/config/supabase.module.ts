import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';
export const SUPABASE_ADMIN = 'SUPABASE_ADMIN';

function missingSupabaseClient(kind: string): SupabaseClient {
  const message = `Supabase ${kind} no configurado. Copia backend/.env.example a backend/.env y completa SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.`;
  const makeProxy = (path: string): any =>
    new Proxy(function disabledSupabaseCall() {}, {
      get(_target, prop) {
        if (prop === 'then') return undefined;
        if (
          prop === 'onModuleInit' ||
          prop === 'onApplicationBootstrap' ||
          prop === 'onModuleDestroy' ||
          prop === 'beforeApplicationShutdown' ||
          prop === 'onApplicationShutdown'
        ) {
          return undefined;
        }
        return makeProxy(`${path}.${String(prop)}`);
      },
      apply() {
        throw new Error(`${message} Metodo invocado: ${path}`);
      },
    });

  return makeProxy(`supabase.${kind}`) as SupabaseClient;
}

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SupabaseClient => {
        const url = config.get<string>('SUPABASE_URL');
        const anonKey = config.get<string>('SUPABASE_ANON_KEY');
        if (!url || !anonKey) return missingSupabaseClient('client');

        return createClient(url, anonKey, {
          auth: { persistSession: false },
        });
      },
    },
    {
      provide: SUPABASE_ADMIN,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SupabaseClient => {
        const url = config.get<string>('SUPABASE_URL');
        const serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
        if (!url || !serviceRoleKey) return missingSupabaseClient('admin');

        return createClient(url, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      },
    },
  ],
  exports: [SUPABASE_CLIENT, SUPABASE_ADMIN],
})
export class SupabaseModule {}
