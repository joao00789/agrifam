import { z } from "zod";

export const productInputSchema = z.object({
  name: z
    .string({ message: "Nome é obrigatório." })
    .trim()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres." })
    .max(120, "Nome do produto muito longo."),
  price: z.coerce
    .number({ message: "Preço é obrigatório." })
    .positive({ message: "Preço deve ser maior que zero." }),
  unit: z
    .string({ message: "Unidade é obrigatória." })
    .trim()
    .min(1, { message: "Unidade é obrigatória." })
    .max(40, "Unidade muito longa."),
  location: z
    .string({ message: "Localização é obrigatória." })
    .trim()
    .min(2, { message: "Localização deve ter pelo menos 2 caracteres." })
    .max(120, "Localização muito longa."),
  category: z
    .string({ message: "Categoria é obrigatória." })
    .trim()
    .min(1, { message: "Categoria é obrigatória." })
    .max(80, "Categoria muito longa."),
  image: z.string().trim().max(2048, "Endereço da imagem muito longo.").optional().default(""),
  rating: z.coerce
    .number()
    .min(0, { message: "Nota deve ser entre 0 e 5." })
    .max(5, { message: "Nota deve ser entre 0 e 5." })
    .optional()
    .default(5),
});

export const productUpdateSchema = productInputSchema.partial();

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
