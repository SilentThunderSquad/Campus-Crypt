import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const databaseUrl = process.env.DATABASE_URL ?? '';

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
  serverOrigin: process.env.SERVER_ORIGIN ?? 'http://localhost:4000',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  databaseUrl,
};
