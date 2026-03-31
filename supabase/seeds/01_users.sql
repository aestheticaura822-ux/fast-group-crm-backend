-- Insert sample users (after auth.users created)
INSERT INTO public.users (id, name, email, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@fastgroup.com', 'admin'),
    ('00000000-0000-0000-0000-000000000002', 'CSR Manager', 'csr@fastgroup.com', 'csr'),
    ('00000000-0000-0000-0000-000000000003', 'Sales Rep', 'sales@fastgroup.com', 'sales');