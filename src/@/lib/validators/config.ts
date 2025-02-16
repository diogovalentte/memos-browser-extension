import { z } from 'zod';

export const configSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string(),
});

export type configType = z.infer<typeof configSchema>;
