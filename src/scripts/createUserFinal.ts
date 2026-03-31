import { supabaseAdmin } from '../config/supabase'

async function createUserFinal() {
  console.log('🚀 Creating user with admin API...')

  const userData = {
    email: 'amber21@gmail.com',
    password: 'amber1234@',
    name: 'Amber',
    role: 'admin'
  }

  try {
    // Delete if exists
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('email', userData.email)

    // Create in auth.users with admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        role: userData.role
      }
    })

    if (authError) throw authError
    console.log('✅ Auth user created:', authData.user.id)

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) throw profileError
    console.log('✅ Profile created')

    console.log('\n🎉 User ready:')
    console.log('📧 Email:', userData.email)
    console.log('🔑 Password:', userData.password)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createUserFinal()