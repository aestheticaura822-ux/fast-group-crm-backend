-- Create scraper jobs table
CREATE TABLE public.scraper_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'maps')),
    keywords TEXT[],
    location TEXT,
    status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
    results_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error TEXT
);

-- Create indexes
CREATE INDEX idx_scraper_jobs_status ON public.scraper_jobs(status);
CREATE INDEX idx_scraper_jobs_created_by ON public.scraper_jobs(created_by);

-- Enable RLS
ALTER TABLE public.scraper_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their scraper jobs"
    ON public.scraper_jobs FOR SELECT
    USING (created_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create scraper jobs"
    ON public.scraper_jobs FOR INSERT
    WITH CHECK (created_by = auth.uid());