-- Insert sample activities
INSERT INTO public.lead_activities (lead_id, user_id, activity_type, notes)
VALUES 
    ((SELECT id FROM public.leads WHERE email = 'ahmed@techsol.com'), 
     '00000000-0000-0000-0000-000000000002', 
     'call', 
     'Initial call - interested in quote'),
    
    ((SELECT id FROM public.leads WHERE email = 'fatima@digital.com'), 
     '00000000-0000-0000-0000-000000000002', 
     'email', 
     'Sent brochure and pricing');