-- Additional triggers

-- Update lead conversion timestamp
CREATE OR REPLACE FUNCTION update_conversion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'converted' AND OLD.status != 'converted' THEN
        NEW.converted_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_conversion
    BEFORE UPDATE OF status ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_conversion_timestamp();

-- Log lead assignment
CREATE OR REPLACE FUNCTION log_lead_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        INSERT INTO public.lead_activities (
            lead_id,
            user_id,
            activity_type,
            notes,
            old_status,
            new_status
        ) VALUES (
            NEW.id,
            auth.uid(),
            'assignment',
            'Lead assigned to ' || (SELECT name FROM public.users WHERE id = NEW.assigned_to),
            OLD.assigned_to::text,
            NEW.assigned_to::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_lead_assignment_trigger
    AFTER UPDATE OF assigned_to ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_assignment();