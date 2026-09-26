import { z } from 'zod';
import type { ReactNode } from 'react'

export type WSProviderType = {
    children: ReactNode;
    autoConnect?: boolean;
}


export const ApiErrorResponseSchema = z.object({
    message: z.string(),
    error: z.object({
        statusCode: z.number(),
        rawErrors: z.array(z.string()),
    }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

