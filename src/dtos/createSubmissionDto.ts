import { z } from 'zod';

// export interface CreateSubmissionDto {
//     userID: string;
//     problemID: string;
//     code: string;
//     language: string;
// }

export const CreateSubmissionZodSchema = z
    .object({
        userID: z.string(),
        problemID: z.int(),
        code: z.string(),
        language: z.string(),
    })
    .strict();
export type CreateSubmissionDto = z.infer<typeof CreateSubmissionZodSchema>;
