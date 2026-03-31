-- Additional RLS policies for better security

-- Lead assignment policy
CREATE POLICY "Sales can view leads assigned to them"
    ON public.leads FOR SELECT
    USING (
        assigned_to = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'sales'
        )
    );

-- Activity logging policy
CREATE POLICY "System can create activity logs"
    ON public.lead_activities FOR INSERT
    WITH CHECK (true);

-- Admin can do everything
CREATE POLICY "Admin full access to leads"
    ON public.leads FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to activities"
    ON public.lead_activities FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );