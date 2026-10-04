-- إنشاء جدول الشحنات
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone_number text not null,
  address text not null,
  received_date date not null,
  delivery_date date,
  status text not null default 'pending',
  price numeric(10, 2) not null default 0,
  cost numeric(10, 2) not null default 0,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- إنشاء فهرس للبحث السريع
create index if not exists idx_shipments_status on public.shipments(status);
create index if not exists idx_shipments_received_date on public.shipments(received_date);
create index if not exists idx_shipments_customer_name on public.shipments(customer_name);

-- تفعيل Row Level Security
alter table public.shipments enable row level security;

-- إنشاء سياسات للسماح بجميع العمليات (بدون مصادقة)
create policy "Allow all operations on shipments"
  on public.shipments
  for all
  using (true)
  with check (true);

-- إنشاء دالة لتحديث updated_at تلقائياً
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- إنشاء trigger لتحديث updated_at عند التعديل
drop trigger if exists update_shipments_updated_at on public.shipments;
create trigger update_shipments_updated_at
  before update on public.shipments
  for each row
  execute function public.update_updated_at_column();
