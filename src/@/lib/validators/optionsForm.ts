import { z } from 'zod';

export const optionsFormSchema = z.object({
  baseUrl: z.string().url('This has to be a URL'),
  useApiKey: z.boolean().default(false),
  apiKey: z.string().optional(),
});

export type optionsFormValues = z.infer<typeof optionsFormSchema>;
