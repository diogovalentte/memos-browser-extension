import { z } from 'zod';

export const bookmarkFormSchema = z.object({
  url: z.string().url('This has to be a URL'),
  tags: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string(),
      })
    )
    .nullish(),
  name: z.string(),
  content: z.string(),
  createTime: z.string().optional(),
});

export type bookmarkFormValues = z.infer<typeof bookmarkFormSchema>;
