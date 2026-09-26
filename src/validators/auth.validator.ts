import { z } from "zod";
import {
    isStrongPassword,
    STRONG_PASSWORD_MESSAGE,
} from "@/lib/password-policy";

export const strongPasswordSchema = z
    .string()
    .min(1, "Password is required")
    .refine(isStrongPassword, {
        message: STRONG_PASSWORD_MESSAGE,
    });

export const loginRequestSchema = z.object({
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
});

const registerBaseSchema = z.object({
    first_name: z.string().min(1, "First name is required").max(20),
    last_name: z.string().min(1, "Last name is required").max(20),
    email: z.string().email("Invalid email format"),
    phone: z.string().max(20),
    password: strongPasswordSchema,
    referral_code: z.string().max(32).optional(),
});

const termsAcceptedSchema = z.boolean().refine((accepted) => accepted, {
    message: "You must agree to the Terms & Conditions",
});

const privacyAcknowledgedSchema = z.boolean().refine((acknowledged) => acknowledged, {
    message: "You must acknowledge the Privacy Notice",
});

export const registerRequestSchema = registerBaseSchema.extend({
    terms_accepted: termsAcceptedSchema,
    privacy_notice_acknowledged: privacyAcknowledgedSchema,
});

export const registerFormSchema = registerBaseSchema
    .extend({
        confirmPassword: z.string().min(1, "Please confirm your password"),
        acceptTerms: termsAcceptedSchema,
        privacyAcknowledged: privacyAcknowledgedSchema,
    })
    .refine((values) => values.password === values.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type LoginSuccessData = {
    id_: string;
    f_: string;
    l_: string;
    e_: string;
    access_token: string;
    token_type: string;
};

export type SessionUserData = {
    id_: string;
    f_: string;
    l_: string;
    e_: string;
};
