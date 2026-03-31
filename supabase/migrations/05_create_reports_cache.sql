-- Create reports cache table
CREATE TABLE public.reports_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL,
    data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 day'
);

-- Create indexes
CREATE INDEX idx_reports_cache_type ON public.reports_cache(report_type);
CREATE INDEX idx_reports_cache_expires ON public.reports_cache(expires_at);

-- Enable RLS
ALTER TABLE public.reports_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view reports"
    ON public.reports_cache FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'csr', 'sales')
        )
    );

-- Create function to clean expired reports
CREATE OR REPLACE FUNCTION clean_expired_reports()
RETURNS void AS $$
BEGIN
    DELETE FROM public.reports_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;