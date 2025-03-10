import { z } from 'zod';

export const visibilityOptions = [{ name: 'PUBLIC', id: 0 }, { name: 'PRIVATE', id: 0 }, { name: 'PROTECTED', id: 0 }];

export const memoFormSchema = z.object({
  url: z.string().url('This has to be a URL'),
  tags: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string(),
      })
    )
    .nullish(),
  content: z.string().optional(),
  createDate: z
    .object(
      {
        date: z.string().optional(), 
        time: z.string().optional(),
      }
    )
    .refine((data) => !(data.time && !data.date), {
      message: 'Date is required when time is provided',
      path: ['time'],
    }),
  visibility: z
    .object({
      name: z.string(),
    }),
});

export type memoFormValues = z.infer<typeof memoFormSchema>;
