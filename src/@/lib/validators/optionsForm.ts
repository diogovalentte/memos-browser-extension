import { z } from 'zod';

export const optionsFormSchema = z.object({
    baseUrl: z.string().url('This has to be a URL'),
    apiKey: z.string(),
    defaultVisibility: z
      .object({
        name: z.string(),
      }),
});

export type optionsFormValues = z.infer<typeof optionsFormSchema>;
