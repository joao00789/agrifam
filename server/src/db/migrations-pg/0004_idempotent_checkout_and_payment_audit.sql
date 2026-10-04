ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS checkout_request_id text,
  ADD COLUMN IF NOT EXISTS checkout_fingerprint text,
  ADD COLUMN IF NOT EXISTS checkout_url text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS orders_buyer_checkout_request_unique
  ON public.orders(buyer_id, checkout_request_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.payment_events (
  id bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES public.orders(id),
  payment_id text NOT NULL,
  payment_status text NOT NULL,
  amount double precision NOT NULL,
  currency text NOT NULL,
  seller_account_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_events_payment_status_unique UNIQUE(payment_id, payment_status)
);
