-- إنشاء جدول المصروفات
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(10, 2) not null,
  date date not null,
  category text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- إنشاء فهرس للبحث السريع
create index if not exists idx_expenses_date on public.expenses(date);
create index if not exists idx_expenses_category on public.expenses(category);

-- تفعيل Row Level Security
alter table public.expenses enable row level security;

-- إنشاء سياسات للسماح بجميع العمليات (بدون مصادقة)
create policy "Allow all operations on expenses"
  on public.expenses
  for all
  using (true)
  with check (true);

-- إنشاء trigger لتحديث updated_at عند التعديل
drop trigger if exists update_expenses_updated_at on public.expenses;
create trigger update_expenses_updated_at
  before update on public.expenses
  for each row
  execute function public.update_updated_at_column();
