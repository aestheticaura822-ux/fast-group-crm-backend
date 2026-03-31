"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStats = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const supabase_1 = require("../config/supabase");
const logger_utils_1 = require("../utils/logger.utils");
const getUsers = async (req, res) => {
    try {
        const { data: users, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(users);
    }
    catch (error) {
        logger_utils_1.logger.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: user, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        logger_utils_1.logger.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role }
        });
        if (authError)
            throw authError;
        // Create user in public.users
        const { data: user, error: userError } = await supabase_1.supabaseAdmin
            .from('users')
            .insert({
            id: authData.user.id,
            name,
            email,
            role
        })
            .select()
            .single();
        if (userError)
            throw userError;
        logger_utils_1.logger.info(`User created: ${email} by ${req.user?.email}`);
        res.status(201).json(user);
    }
    catch (error) {
        logger_utils_1.logger.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const authUser = req.user;
        // Check if user exists
        const { data: existingUser } = await supabase_1.supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Only admin can update roles
        if (updates.role && authUser.role !== 'admin') {
            delete updates.role;
        }
        // Update user
        const { data: user, error } = await supabase_1.supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        logger_utils_1.logger.info(`User updated: ${id} by ${authUser.email}`);
        res.json(user);
    }
    catch (error) {
        logger_utils_1.logger.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Delete from Supabase Auth
        const { error: authError } = await supabase_1.supabaseAdmin.auth.admin.deleteUser(id);
        if (authError)
            throw authError;
        // Delete from public.users (cascade will handle)
        const { error } = await supabase_1.supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        logger_utils_1.logger.info(`User deleted: ${id} by ${req.user?.email}`);
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        logger_utils_1.logger.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
exports.deleteUser = deleteUser;
const getUserStats = async (req, res) => {
    try {
        const { id } = req.params;
        // Get leads handled
        const { data: leads, error: leadsError } = await supabase_1.supabaseAdmin
            .from('leads')
            .select('*')
            .eq('assigned_to', id);
        if (leadsError)
            throw leadsError;
        // Get conversions
        const conversions = leads.filter(l => l.status === 'converted');
        // Get activities
        const { data: activities, error: activitiesError } = await supabase_1.supabaseAdmin
            .from('lead_activities')
            .select('*')
            .eq('user_id', id);
        if (activitiesError)
            throw activitiesError;
        const stats = {
            totalLeads: leads.length,
            conversions: conversions.length,
            conversionRate: leads.length ? (conversions.length / leads.length) * 100 : 0,
            activities: activities.length,
            hotLeads: leads.filter(l => l.type === 'hot').length,
            warmLeads: leads.filter(l => l.type === 'warm').length,
            coldLeads: leads.filter(l => l.type === 'cold').length
        };
        res.json(stats);
    }
    catch (error) {
        logger_utils_1.logger.error('Get user stats error:', error);
        res.status(500).json({ error: 'Failed to fetch user stats' });
    }
};
exports.getUserStats = getUserStats;
