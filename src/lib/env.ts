import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required'),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

const rawProcessEnv = {
  NODE_ENV: process.env.NODE_ENV,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
};

const isSkipValidation =
  process.env.SKIP_ENV_VALIDATION === '1' || process.env.SKIP_ENV_VALIDATION === 'true';

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;
export type AppEnv = ServerEnv & ClientEnv;

let parsedEnv: AppEnv;

if (isSkipValidation) {
  parsedEnv = rawProcessEnv as unknown as AppEnv;
} else {
  const serverResult = serverSchema.safeParse(rawProcessEnv);
  const clientResult = clientSchema.safeParse(rawProcessEnv);

  if (!serverResult.success || !clientResult.success) {
    const errorMessages: string[] = [];

    if (!serverResult.success) {
      errorMessages.push(
        ...serverResult.error.issues.map(
          (issue) => `  - [Server] ${issue.path.join('.')}: ${issue.message}`
        )
      );
    }

    if (!clientResult.success) {
      errorMessages.push(
        ...clientResult.error.issues.map(
          (issue) => `  - [Client] ${issue.path.join('.')}: ${issue.message}`
        )
      );
    }

    const errorDetails = errorMessages.join('\n');
    throw new Error(
      `\n❌ Missing or invalid environment variables:\n${errorDetails}\n\nCheck your .env.local file or refer to .env.example.\n`
    );
  }

  parsedEnv = {
    ...serverResult.data,
    ...clientResult.data,
  };
}

export const env = parsedEnv;
