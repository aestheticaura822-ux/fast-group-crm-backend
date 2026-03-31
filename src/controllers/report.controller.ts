import { Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { reportQueue } from '../config/redis'
import { logger } from '../utils/logger.utils'

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get counts
    const [
      totalLeads,
      todayLeads,
      hotLeads,
      conversions,
      teamStats
    ] = await Promise.all([
      supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString()),
      supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })
        .eq('type', 'hot'),
      supabaseAdmin.from('leads').select('*', { count: 'exact', head: true })
        .eq('status', 'converted'),
      supabaseAdmin.from('users').select(`
        id,
        name,
        leads:leads(count)
      `).eq('role', 'csr')
    ])

    // Get recent activities
    const { data: recentActivities } = await supabaseAdmin
      .from('lead_activities')
      .select(`
        *,
        lead:lead_id(name),
        user:user_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    const stats = {
      totalLeads: totalLeads.count || 0,
      todayLeads: todayLeads.count || 0,
      hotLeads: hotLeads.count || 0,
      conversions: conversions.count || 0,
      conversionRate: totalLeads.count 
        ? ((conversions.count || 0) / totalLeads.count) * 100 
        : 0,
      teamPerformance: teamStats.data?.map(user => ({
        userId: user.id,
        userName: user.name,
        leadsHandled: user.leads?.[0]?.count || 0
      })),
      recentActivities: recentActivities || []
    }

    res.json(stats)
  } catch (error) {
    logger.error('Dashboard stats error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
}

export const getDailyReport = async (req: Request, res: Response) => {
  try {
    const date = req.query.date 
      ? new Date(req.query.date as string)
      : new Date()
    
    date.setHours(0, 0, 0, 0)
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    // 🚫 TEMPORARILY DISABLE CACHE FOR TESTING
    // const cacheKey = `daily_report_${date.toISOString().split('T')[0]}`
    // const { data: cached } = await supabaseAdmin
    //   .from('reports_cache')
    //   .select('data')
    //   .eq('report_type', cacheKey)
    //   .gt('expires_at', new Date().toISOString())
    //   .single()

    // if (cached) {
    //   return res.json(cached.data)
    // }

    // Get fresh leads for the day
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDay.toISOString())
      .order('created_at')

    if (error) throw error

    console.log(`📊 Daily report for ${date.toISOString().split('T')[0]}: ${leads.length} leads`)

    // Calculate statistics
    const stats = {
      date: date.toISOString().split('T')[0],
      totalLeads: leads.length,
      byType: {
        hot: leads.filter(l => l.type === 'hot').length,
        warm: leads.filter(l => l.type === 'warm').length,
        cold: leads.filter(l => l.type === 'cold').length
      },
      byStatus: {
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        followup: leads.filter(l => l.status === 'followup').length,
        interested: leads.filter(l => l.status === 'interested').length,
        converted: leads.filter(l => l.status === 'converted').length,
        notInterested: leads.filter(l => l.status === 'not_interested').length
      },
      bySource: leads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      conversions: leads.filter(l => l.status === 'converted').length,
      conversionRate: leads.length 
        ? (leads.filter(l => l.status === 'converted').length / leads.length) * 100 
        : 0
    }

    // Update cache
    try {
      const cacheKey = `daily_report_${date.toISOString().split('T')[0]}`
      await supabaseAdmin
        .from('reports_cache')
        .delete()
        .eq('report_type', cacheKey)

      await supabaseAdmin
        .from('reports_cache')
        .insert({
          report_type: cacheKey,
          data: stats,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
    } catch (cacheError) {
      console.log('⚠️ Cache update failed:', cacheError)
    }

    res.json(stats)
  } catch (error) {
    console.error('❌ Daily report error:', error)
    res.status(500).json({ error: 'Failed to generate daily report' })
  }
}
export const getMonthlyReport = async (req: Request, res: Response) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear()
    const month = Number(req.query.month) || new Date().getMonth() + 1

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    console.log(`📊 Monthly report for ${year}-${month}: fetching fresh data`)

    // Get fresh leads for the month
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at')

    if (error) {
      console.error('❌ Error fetching leads:', error)
      throw error
    }

    console.log(`📊 Found ${leads?.length || 0} leads for ${year}-${month}`)

    // Define interface for daily data
    interface DailyData {
      date: number
      leads: number
      conversions: number
    }

    // Group by day with proper typing
    const dailyData: Record<number, DailyData> = {}
    
    if (leads && leads.length > 0) {
      leads.forEach((lead: any) => {
        const day = new Date(lead.created_at).getDate()
        if (!dailyData[day]) {
          dailyData[day] = {
            date: day,
            leads: 0,
            conversions: 0
          }
        }
        dailyData[day].leads++
        if (lead.status === 'converted') {
          dailyData[day].conversions++
        }
      })
    }

    // Convert to array and sort with proper typing
    const dailyBreakdown: DailyData[] = Object.values(dailyData).sort((a, b) => a.date - b.date)

    // Calculate converted leads
    const convertedLeads = leads?.filter((l: any) => l.status === 'converted') || []
    const totalRevenue = convertedLeads.reduce((sum: number, l: any) => sum + (l.deal_value || 0), 0)
    
    const stats = {
      year,
      month,
      totalLeads: leads?.length || 0,
      conversions: convertedLeads.length,
      conversionRate: leads?.length 
        ? (convertedLeads.length / leads.length) * 100 
        : 0,
      totalRevenue,
      averageDealValue: convertedLeads.length > 0 ? totalRevenue / convertedLeads.length : 0,
      byType: {
        hot: leads?.filter((l: any) => l.type === 'hot').length || 0,
        warm: leads?.filter((l: any) => l.type === 'warm').length || 0,
        cold: leads?.filter((l: any) => l.type === 'cold').length || 0
      },
      bySource: leads?.reduce((acc: Record<string, number>, lead: any) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      dailyBreakdown
    }

    // Update cache
    try {
      const cacheKey = `monthly_report_${year}_${month}`
      
      // Delete old cache
      await supabaseAdmin
        .from('reports_cache')
        .delete()
        .eq('report_type', cacheKey)

      // Insert new cache
      await supabaseAdmin
        .from('reports_cache')
        .insert({
          report_type: cacheKey,
          data: stats,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      
      console.log('✅ Monthly report cached')
    } catch (cacheError) {
      console.log('⚠️ Cache update failed:', cacheError)
    }

    res.json(stats)
  } catch (error) {
    console.error('❌ Monthly report error:', error)
    res.status(500).json({ error: 'Failed to generate monthly report' })
  }
}
export const getCSRPerformance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { startDate, endDate } = req.query

    let query = supabaseAdmin
      .from('leads')
      .select(`
        *,
        activities:lead_activities(count)
      `)
      .eq('assigned_to', userId)

    if (startDate) {
      query = query.gte('created_at', new Date(startDate as string).toISOString())
    }
    if (endDate) {
      query = query.lte('created_at', new Date(endDate as string).toISOString())
    }

    const { data: leads, error } = await query

    if (error) throw error

    const stats = {
      userId,
      totalLeads: leads.length,
      conversions: leads.filter(l => l.status === 'converted').length,
      conversionRate: leads.length 
        ? (leads.filter(l => l.status === 'converted').length / leads.length) * 100 
        : 0,
      totalActivities: leads.reduce((sum, l) => sum + (l.activities?.[0]?.count || 0), 0),
      byType: {
        hot: leads.filter(l => l.type === 'hot').length,
        warm: leads.filter(l => l.type === 'warm').length,
        cold: leads.filter(l => l.type === 'cold').length
      },
      leads: leads.map(l => ({
        id: l.id,
        name: l.name,
        status: l.status,
        type: l.type,
        created_at: l.created_at
      }))
    }

    res.json(stats)
  } catch (error) {
    logger.error('CSR performance error:', error)
    res.status(500).json({ error: 'Failed to fetch CSR performance' })
  }
}

export const getSalesPerformance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { startDate, endDate } = req.query

    let query = supabaseAdmin
      .from('leads')
      .select('*')
      .eq('converted_by', userId)
      .eq('status', 'converted')

    if (startDate) {
      query = query.gte('converted_at', new Date(startDate as string).toISOString())
    }
    if (endDate) {
      query = query.lte('converted_at', new Date(endDate as string).toISOString())
    }

    const { data: conversions, error } = await query

    if (error) throw error

    const stats = {
      userId,
      totalConversions: conversions.length,
      totalRevenue: conversions.reduce((sum, l) => sum + (l.deal_value || 0), 0),
      averageDealValue: conversions.length 
        ? conversions.reduce((sum, l) => sum + (l.deal_value || 0), 0) / conversions.length
        : 0,
      conversions: conversions.map(c => ({
        id: c.id,
        name: c.name,
        deal_value: c.deal_value,
        converted_at: c.converted_at
      }))
    }

    res.json(stats)
  } catch (error) {
    logger.error('Sales performance error:', error)
    res.status(500).json({ error: 'Failed to fetch sales performance' })
  }
}

export const getLeadSourcesReport = async (req: Request, res: Response) => {
  try {
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('source')

    if (error) throw error

    const sources = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = leads.length
    const report = Object.entries(sources).map(([source, count]) => ({
      source,
      count,
      percentage: (count / total) * 100
    }))

    res.json(report)
  } catch (error) {
    logger.error('Lead sources report error:', error)
    res.status(500).json({ error: 'Failed to generate lead sources report' })
  }
}

export const getConversionFunnel = async (req: Request, res: Response) => {
  try {
    const stages = ['new', 'contacted', 'followup', 'interested', 'converted']
    
    const funnel = await Promise.all(
      stages.map(async (stage) => {
        const { count } = await supabaseAdmin
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('status', stage)
        
        return {
          stage,
          count: count || 0
        }
      })
    )

    res.json(funnel)
  } catch (error) {
    logger.error('Conversion funnel error:', error)
    res.status(500).json({ error: 'Failed to generate conversion funnel' })
  }
}

export const exportReport = async (req: Request, res: Response) => {
  try {
    const { type, startDate, endDate } = req.query

    // Queue report generation
    const job = await reportQueue.add({
      type,
      startDate,
      endDate,
      format: type
    })

    res.json({
      message: 'Report generation started',
      jobId: job.id
    })
  } catch (error) {
    logger.error('Export report error:', error)
    res.status(500).json({ error: 'Failed to start report export' })
  }
}