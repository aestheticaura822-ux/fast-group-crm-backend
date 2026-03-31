-- Create leads table
CREATE TABLE public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    company TEXT,
    message TEXT,
    type TEXT CHECK (type IN ('hot', 'warm', 'cold')) DEFAULT 'warm',
    status TEXT CHECK (status IN ('new', 'contacted', 'followup', 'interested', 'converted', 'not_interested')) DEFAULT 'new',
    source TEXT CHECK (source IN ('website', 'facebook', 'instagram', 'linkedin', 'maps', 'manual', 'csv', 'import')) DEFAULT 'website',
    deal_value DECIMAL(10,2),
    assigned_to UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id),
    converted_by UUID REFERENCES public.users(id),
    converted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_type ON public.leads(type);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_phone ON public.leads(phone);

-- Add trigger
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "CSR and Sales can view leads"
    ON public.leads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'csr', 'sales')
        )
    );

CREATE POLICY "CSR can create leads"
    ON public.leads FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'csr')
        )
    );

CREATE POLICY "CSR can update assigned leads"
    ON public.leads FOR UPDATE
    USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to notify on new lead
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'new_lead',
        json_build_object('id', NEW.id, 'name', NEW.name, 'type', NEW.type)::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_new_lead_trigger
    AFTER INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_lead();