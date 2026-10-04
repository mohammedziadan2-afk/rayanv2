-- إضافة الحقول الجديدة لجدول الشحنات
alter table public.shipments
  add column if not exists tracking_number text unique,
  add column if not exists sender_name text,
  add column if not exists sender_phone text,
  add column if not exists sender_address text,
  add column if not exists sender_country text,
  add column if not exists receiver_name text,
  add column if not exists receiver_phone text,
  add column if not exists receiver_address text,
  add column if not exists receiver_country text,
  add column if not exists description text,
  add column if not exists amount numeric(10, 2),
  add column if not exists weight numeric(10, 2),
  add column if not exists payment_method text default 'cash',
  add column if not exists payment_location text default 'sender',
  add column if not exists location_x numeric(10, 2) default 0,
  add column if not exists location_y numeric(10, 2) default 0,
  add column if not exists location_label text,
  add column if not exists deleted_at timestamp with time zone;

-- نقل البيانات القديمة إلى الحقول الجديدة
update public.shipments
set 
  receiver_name = customer_name,
  receiver_phone = phone_number,
  receiver_address = address,
  amount = price
where receiver_name is null;

-- إنشاء فهارس للحقول الجديدة
create index if not exists idx_shipments_tracking_number on public.shipments(tracking_number);
create index if not exists idx_shipments_sender_name on public.shipments(sender_name);
create index if not exists idx_shipments_receiver_name on public.shipments(receiver_name);
create index if not exists idx_shipments_deleted_at on public.shipments(deleted_at);

-- تحديث السياسة للسماح بالوصول للبيانات غير المحذوفة فقط
drop policy if exists "Allow all operations on shipments" on public.shipments;

create policy "Allow all operations on active shipments"
  on public.shipments
  for all
  using (deleted_at is null)
  with check (deleted_at is null);
