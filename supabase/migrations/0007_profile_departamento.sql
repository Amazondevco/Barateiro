alter table profiles add column if not exists departamento_id uuid references departamentos(id) on delete set null;
