-- Eu explico esta etapa: Prepara a divisão de pagamentos e oculta lojas/produtos de demonstração sem apagar o histórico.
ALTER TABLE public.producers
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS mercado_pago_user_id text,
  ADD COLUMN IF NOT EXISTS mercado_pago_access_token text,
  ADD COLUMN IF NOT EXISTS mercado_pago_refresh_token text,
  ADD COLUMN IF NOT EXISTS mercado_pago_token_expires_at timestamptz;
--> statement-breakpoint

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
--> statement-breakpoint

-- Eu explico esta etapa: As contas de demonstração são identificadas pelo domínio de e-mail usado apenas localmente.
-- Eu explico esta etapa: Arquive-as para manter as referências do histórico de pedidos e removê-las do catálogo
-- Eu explico esta etapa: público e das listas de produtores.
UPDATE public.producers AS p
SET is_active = false
FROM public.users AS u
WHERE u.id = p.user_id AND u.email LIKE 'seed-%@agrifam.local';
--> statement-breakpoint

UPDATE public.products AS p
SET is_active = false
FROM public.producers AS producer
WHERE producer.id = p.producer_id AND producer.is_active = false;
--> statement-breakpoint

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
--> statement-breakpoint
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS producer_id bigint REFERENCES public.producers(id);
--> statement-breakpoint
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS marketplace_fee double precision NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mercado_pago_preference_id text;
--> statement-breakpoint
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mercado_pago_payment_id text;
--> statement-breakpoint
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'rejected', 'cancelled'));
--> statement-breakpoint

WITH first_item AS (
  SELECT DISTINCT ON (order_id) order_id, producer_id
  FROM public.order_items ORDER BY order_id, id
)
UPDATE public.orders AS o
SET producer_id = first_item.producer_id
FROM first_item
WHERE first_item.order_id = o.id AND o.producer_id IS NULL;
--> statement-breakpoint

-- Eu explico esta etapa: Os pedidos antigos não passaram por um meio de pagamento. Não os apresente como pagos.
UPDATE public.orders SET status = 'cancelled' WHERE status = 'confirmado';
--> statement-breakpoint

-- Eu explico esta etapa: Pedidos antigos de demonstração não têm produtor associado. producer_id pode ficar
-- Eu explico esta etapa: nulo durante a migração para preservar o histórico; o novo checkout exige esse vínculo.
ALTER TABLE public.orders ALTER COLUMN producer_id DROP NOT NULL;
