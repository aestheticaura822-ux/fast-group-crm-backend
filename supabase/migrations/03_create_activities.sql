-- Create lead activities table
CREATE TABLE public.lead_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    activity_type TEXT CHECK (activity_type IN ('call', 'email', 'note', 'status_change', 'assignment')),
    notes TEXT,
    old_status TEXT,
    new_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_activities_user_id ON public.lead_activities(user_id);
CREATE INDEX idx_activities_created_at ON public.lead_activities(created_at);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view activities of their leads"
    ON public.lead_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_id 
            AND (l.assigned_to = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
        )
    );

CREATE POLICY "CSR can create activities"
    ON public.lead_activities FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'csr')
        )
    );

-- Create function to log status changes
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.lead_activities (
            lead_id,
            user_id,
            activity_type,
            old_status,
            new_status,
            notes
        ) VALUES (
            NEW.id,
            auth.uid(),
            'status_change',
            OLD.status,
            NEW.status,
            'Status updated'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_lead_status_change_trigger
    AFTER UPDATE OF status ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_status_change();