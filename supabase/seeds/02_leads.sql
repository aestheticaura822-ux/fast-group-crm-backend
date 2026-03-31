-- Insert sample leads
INSERT INTO public.leads (name, phone, email, company, type, status, source, assigned_to, notes)
VALUES 
    ('Ahmed Khan', '+92 300 1234567', 'ahmed@techsol.com', 'Tech Solutions', 'hot', 'new', 'website', '00000000-0000-0000-0000-000000000002', 'Interested in printing services'),
    ('Fatima Ali', '+92 321 7654321', 'fatima@digital.com', 'Digital Agency', 'warm', 'contacted', 'facebook', '00000000-0000-0000-0000-000000000002', 'Requested brochure'),
    ('Omar Hassan', '+92 333 9876543', 'omar@printshop.com', 'Printing Press', 'cold', 'followup', 'linkedin', '00000000-0000-0000-0000-000000000003', 'Compare prices');