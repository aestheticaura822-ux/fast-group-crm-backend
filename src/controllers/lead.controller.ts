import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { emailQueue, leadQueue } from "../config/redis"; 
import { logger } from "../utils/logger.utils";
import { AuthRequest } from "../middleware/auth.middleware";

/* ==================== GET LEADS ==================== */
export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, source, assigned_to } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    let query = supabaseAdmin.from("leads").select("*", { count: "exact" });

    if (status) query = query.eq("status", status as string);
    if (type) query = query.eq("type", type as string);
    if (source) query = query.eq("source", source as string);
    if (assigned_to) query = query.eq("assigned_to", assigned_to as string);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error("Get leads error:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
};

/* ==================== GET LEAD BY ID ==================== */
export const getLeadById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("leads")
      .select(`
        *,
        assigned_to_user:assigned_to(id,name,email),
        created_by_user:created_by(id,name,email),
        converted_by_user:converted_by(id,name,email)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    res.json(data);
  } catch (error) {
    logger.error("Get lead error:", error);
    res.status(500).json({ error: "Failed to fetch lead" });
  }
};

/* ==================== CREATE LEAD ==================== */
export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadData = req.body;
    const user = (req as AuthRequest).user;

    if (!user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!leadData.name || !leadData.email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }

    console.log('📝 Creating lead for user:', user.id);
    console.log('Lead data:', leadData);

    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert({
        ...leadData,
        created_by: user.id,
        source: leadData.source || "manual",
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      
      // Check if it's an RLS error
      if (error.message.includes('row-level security policy')) {
        res.status(403).json({ 
          error: "Permission denied. Please check RLS policies.",
          details: error.message 
        });
        return;
      }
      
      throw error;
    }

    console.log('✅ Lead created:', data?.id);
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Create lead error:', error);
    res.status(500).json({ error: "Failed to create lead" });
  }
};
/* ==================== CREATE PUBLIC LEAD ==================== */
export const createPublicLead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { recaptchaToken, ...leadData } = req.body;

    // Check if we're in mock mode
    const isMockMode = process.env.USE_MOCK === 'true';

    // Log received data
    console.log('📝 Received lead data:', {
      ...leadData,
      recaptchaToken: recaptchaToken ? '✅ provided' : '❌ missing'
    });

    // Skip reCAPTCHA in mock mode
    if (isMockMode) {
      console.log('🔓 MOCK mode: Skipping reCAPTCHA verification');
    } else {
      // Real reCAPTCHA verification (for production)
      if (!recaptchaToken) {
        res.status(400).json({ error: "reCAPTCHA token missing" });
        return;
      }

      const secret = process.env.RECAPTCHA_SECRET_KEY;

      if (!secret) {
        res.status(500).json({ error: "reCAPTCHA secret missing" });
        return;
      }

      const verificationResponse = await fetch(
        "https://www.google.com/recaptcha/api/siteverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            secret,
            response: recaptchaToken,
          }),
        }
      );

      const verificationData = await verificationResponse.json();

      if (!verificationData.success) {
        res.status(400).json({ error: "reCAPTCHA verification failed" });
        return;
      }
    }

    // Validate required fields
    if (!leadData.name || !leadData.phone || !leadData.email || !leadData.company) {
      res.status(400).json({ 
        error: "Missing required fields",
        required: ['name', 'phone', 'email', 'company']
      });
      return;
    }

    // Insert lead into Supabase (REAL)
    console.log('💾 Saving lead to Supabase...');
    
    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert({
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        company: leadData.company,
        message: leadData.message || '',
        source: "website",
        type: "warm",
        status: "new",
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Lead saved to Supabase with ID:', data.id);

    // Queue operations (will work in mock mode)
    try {
      // Add to lead queue
      await leadQueue.add("new-lead", {
        leadId: data.id,
        leadName: data.name,
        source: "website",
        email: data.email,
        phone: data.phone
      });
      console.log('📨 Added to lead queue');

      // Add to email queue
      await emailQueue.add("new-lead", {
        leadId: data.id,
        leadName: data.name,
        source: "website",
        email: data.email
      });
      console.log('📨 Added to email queue');

    } catch (queueError) {
      // Don't fail the request if queue fails
      console.log('⚠️ Queue error (non-critical):', queueError);
    }

    // Success response
    res.status(201).json({
      success: true,
      message: "Lead submitted successfully",
      leadId: data.id,
    });

  } catch (error) {
    console.error("❌ Create public lead error:", error);
    logger.error("Create public lead error:", error);
    res.status(500).json({ 
      error: "Failed to submit lead",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
/* ==================== UPDATE LEAD ==================== */
export const updateLead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = (req as AuthRequest).user;

    if (!user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    res.json(data);
  } catch (error) {
    logger.error("Update lead error:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
};

/* ==================== DELETE LEAD ==================== */
export const deleteLead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as AuthRequest).user;

    if (!user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { error } = await supabaseAdmin.from("leads").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    logger.error("Delete lead error:", error);
    res.status(500).json({ error: "Failed to delete lead" });
  }
};

/* ==================== ASSIGN LEAD ==================== */
export const assignLead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const user = (req as AuthRequest).user;

    if (!user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!userId) {
      res.status(400).json({ error: "User ID required" });
      return;
    }

    // Check if user exists
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .eq("id", userId)
      .single();

    if (userError || !targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Update lead with assigned user
    const { data, error } = await supabaseAdmin
      .from("leads")
      .update({ 
        assigned_to: userId,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // Log activity
    await supabaseAdmin
      .from("lead_activities")
      .insert({
        lead_id: id,
        user_id: user.id,
        activity_type: "note",
        notes: `Lead assigned to ${targetUser.name}`,
      });

    logger.info(`Lead ${id} assigned to user ${userId}`);

    res.json({ 
      message: "Lead assigned successfully",
      data 
    });
  } catch (error) {
    logger.error("Assign lead error:", error);
    res.status(500).json({ error: "Failed to assign lead" });
  }
};

/* ==================== CONVERT LEAD ==================== */
export const convertLead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { dealValue } = req.body;
    const user = (req as AuthRequest).user;

    if (!user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!dealValue || isNaN(Number(dealValue))) {
      res.status(400).json({ error: "Valid deal value required" });
      return;
    }

    // Update lead status to converted
    const { data, error } = await supabaseAdmin
      .from("leads")
      .update({ 
        status: "converted",
        converted_at: new Date().toISOString(),
        converted_by: user.id,
        deal_value: dealValue,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // Log activity
    await supabaseAdmin
      .from("lead_activities")
      .insert({
        lead_id: id,
        user_id: user.id,
        activity_type: "note",
        notes: `Lead converted with deal value: ${dealValue}`,
      });

    // Add to email queue for notification
    await emailQueue.add("lead_converted", {
      leadId: data.id,
      leadName: data.name,
      dealValue,
    });

    logger.info(`Lead ${id} converted with deal value ${dealValue}`);

    res.json({ 
      message: "Lead converted successfully",
      data 
    });
  } catch (error) {
    logger.error("Convert lead error:", error);
    res.status(500).json({ error: "Failed to convert lead" });
  }
};

/* ==================== GET LEAD ACTIVITIES ==================== */
export const getLeadActivities = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("lead_activities")
      .select(`*, user:user_id(id,name,email)`)
      .eq("lead_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    logger.error("Get activities error:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
};

/* ==================== ADD LEAD ACTIVITY ==================== */
export const addLeadActivity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { activity_type, notes } = req.body;
    const user = (req as AuthRequest).user;

    if (!user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!activity_type) {
      res.status(400).json({ error: "Activity type required" });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from("lead_activities")
      .insert({
        lead_id: id,
        user_id: user.id,
        activity_type,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    logger.error("Add activity error:", error);
    res.status(500).json({ error: "Failed to add activity" });
  }
};