import { z } from "zod";

const email = z.string().trim().email("Saisissez une adresse e-mail valide.");
const password = z.string().min(10, "Le mot de passe doit contenir au moins 10 caractères.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Saisissez votre mot de passe."),
});

export const candidateSignUpSchema = z.object({
  fullName: z.string().trim().min(2, "Saisissez votre nom complet.").max(120),
  email,
  password,
});

export const companySignUpSchema = candidateSignUpSchema.extend({
  companyName: z.string().trim().min(2, "Saisissez le nom de l’entreprise.").max(180),
  companySlug: z
    .string()
    .trim()
    .toLowerCase()
    .max(180, "L’identifiant de l’entreprise ne peut pas dépasser 180 caractères.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilisez un identifiant composé de lettres minuscules, chiffres et tirets."),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  password,
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Les mots de passe ne correspondent pas.",
});

export const companySetupSchema = z.object({
  companyName: z.string().trim().min(2, "Saisissez le nom de l’entreprise.").max(180),
  companySlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilisez un identifiant composé de lettres minuscules, chiffres et tirets."),
});
