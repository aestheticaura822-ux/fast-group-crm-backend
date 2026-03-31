"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.verifyToken = exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.refreshToken = exports.logout = exports.register = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../config/supabase");
const redis_1 = require("../config/redis");
const logger_utils_1 = require("../utils/logger.utils");
// ==================== HELPER FUNCTION FOR ADMIN BYPASS ====================
const createUserWithAdminBypass = async (userData) => {
    console.log(`🔧 Using admin bypass for: ${userData.email}`);
    // Create in auth.users with admin API (NO RATE LIMIT)
    const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
            name: userData.name,
            role: userData.role
        }
    });
    if (authError) {
        console.error('Admin bypass error:', authError);
        throw authError;
    }
    if (!authData?.user) {
        throw new Error('No user returned from admin API');
    }
    // Create profile in public.users
    const { error: profileError } = await supabase_1.supabaseAdmin
        .from('users')
        .insert({
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
    if (profileError) {
        console.error('Profile error in admin bypass:', profileError);
        // Rollback: delete auth user if profile fails
        await supabase_1.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw profileError;
    }
    return authData.user;
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔑 Login attempt for:', email);
        // Get user from database
        const { data: user, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error || !user) {
            console.log('❌ User not found in public.users:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('✅ User found in public.users:', user.id);
        // Verify password with Supabase Auth
        const { data: authData, error: signInError } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
            email,
            password
        });
        if (signInError) {
            console.log('❌ Supabase auth failed:', signInError.message);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('✅ Supabase auth successful:', authData.user.id);
        // ✅ IMPORTANT: Add this line - define userData
        const userData = user;
        // Update last login
        const { error: updateError } = await supabase_1.supabaseAdmin
            .from('users')
            .update({
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
            .eq('id', userData.id);
        if (updateError) {
            logger_utils_1.logger.error('Failed to update last login:', updateError);
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({
            userId: userData.id,
            email: userData.email,
            role: userData.role,
            is_active: userData.is_active
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        logger_utils_1.logger.info(`User logged in: ${userData.email}`);
        res.json({
            user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                is_active: userData.is_active,
                last_login: userData.last_login
            },
            token
        });
    }
    catch (error) {
        logger_utils_1.logger.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.login = login;
// ==================== REGISTER (WITH AUTO RATE LIMIT BYPASS AND AUTO-CONFIRM) ====================
// ==================== REGISTER (FINAL VERSION - AUTO CONFIRM) ====================
const register = async (req, res) => {
    try {
        const { name, email, password, role = 'csr' } = req.body;
        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }
        // Validate role
        const validRoles = ['admin', 'csr', 'sales'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Role must be admin, csr, or sales' });
        }
        // Check if email already exists in public.users
        const { data: existingUser } = await supabase_1.supabaseAdmin
            .from('users')
            .select('email')
            .eq('email', email)
            .maybeSingle();
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        console.log(`📝 Registering ${role}: ${email} using admin API (auto-confirm)`);
        // ✅ USE ADMIN API DIRECTLY - AUTO CONFIRMS EMAIL, NO RATE LIMIT
        const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // THIS IS THE KEY - auto-confirms email
            user_metadata: {
                name,
                role
            }
        });
        if (authError) {
            console.error('❌ Admin API error:', authError);
            return res.status(400).json({ error: authError.message });
        }
        if (!authData?.user) {
            return res.status(400).json({ error: 'Registration failed' });
        }
        console.log('✅ Auth user created with confirmed email:', authData.user.id);
        // Create profile in public.users
        const { data: newUser, error: profileError } = await supabase_1.supabaseAdmin
            .from('users')
            .insert({
            id: authData.user.id,
            name,
            email,
            role: role,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
            .select()
            .single();
        if (profileError) {
            console.error('❌ Profile error:', profileError);
            // Rollback: delete auth user if profile fails
            await supabase_1.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return res.status(500).json({ error: 'Failed to create user profile' });
        }
        // Add welcome email to queue (mock will handle)
        try {
            await redis_1.emailQueue.add('welcome', { email, name });
            console.log('📨 Welcome email queued');
        }
        catch (queueError) {
            console.log('Queue error (ignored):', queueError);
        }
        console.log(`✅ ${role} registered successfully: ${email}`);
        logger_utils_1.logger.info(`New user registered: ${email}`);
        res.status(201).json({
            message: 'Registration successful! You can now login.',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    }
    catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: error.message || 'Registration failed' });
    }
};
exports.register = register;
// ==================== REST OF YOUR FUNCTIONS (unchanged) ====================
const logout = async (_req, res) => {
    try {
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        logger_utils_1.logger.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};
exports.logout = logout;
const refreshToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const { data: user, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single();
        if (error || !user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const userData = user;
        if (!userData.is_active) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }
        const newToken = jsonwebtoken_1.default.sign({
            userId: userData.id,
            email: userData.email,
            role: userData.role,
            is_active: userData.is_active
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: newToken });
    }
    catch (error) {
        logger_utils_1.logger.error('Refresh token error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.refreshToken = refreshToken;
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        const userData = user;
        const { error: signInError } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
            email: userData.email,
            password: currentPassword
        });
        if (signInError) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const { error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(userData.id, { password: newPassword });
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        logger_utils_1.logger.info(`Password changed for user: ${userData.email}`);
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        logger_utils_1.logger.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};
exports.changePassword = changePassword;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const { error } = await supabase_1.supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password`
        });
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        logger_utils_1.logger.info(`Password reset email sent to: ${email}`);
        res.json({ message: 'Password reset email sent' });
    }
    catch (error) {
        logger_utils_1.logger.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }
        const { data: { user }, error: verifyError } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (verifyError || !user) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        const { error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        logger_utils_1.logger.info(`Password reset successful for: ${user.email}`);
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        logger_utils_1.logger.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};
exports.resetPassword = resetPassword;
const verifyToken = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const userData = user;
        res.json({
            user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                is_active: userData.is_active
            }
        });
    }
    catch (error) {
        logger_utils_1.logger.error('Verify token error:', error);
        res.status(500).json({ error: 'Token verification failed' });
    }
};
exports.verifyToken = verifyToken;
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        const { error } = await supabase_1.supabaseAdmin.auth.verifyOtp({
            token_hash: token,
            type: 'email'
        });
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        res.json({ message: 'Email verified successfully' });
    }
    catch (error) {
        logger_utils_1.logger.error('Email verification error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
};
exports.verifyEmail = verifyEmail;
