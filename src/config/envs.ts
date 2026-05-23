import { z } from 'zod';

const isProd = process.env.NODE_ENV === 'prod';

if (!isProd) {
  process.loadEnvFile();
}

const enviromentsSchema = z.object({
  PORT: z.coerce.number(),
  DB_PORT: z.coerce.number(),
  DB_HOST: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  SUPABASE_URL: z.url(),
  SUPABASE_KEY: z.string(),
  SUPABASE_BUCKET: z.string(),
  REDIS_URL: z.url(),
});

const { error, data } = enviromentsSchema.safeParse(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envs = data;

export { envs, isProd };
