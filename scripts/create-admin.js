require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdmin() {
  const email = 'admin@polaxis.com';
  const password = 'Admin1122##';

  console.log(`Creating user: ${email}...`);

  // 1. Check if user exists (by trying to get by email - admin API needed or just listUsers)
  // Actually simplest is just create and catch error if exists, or list users.
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    console.log('✅ User already exists. Updating password and setting admin role...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { 
        password: password, 
        email_confirm: true,
        app_metadata: { role: 'admin' }
      }
    );
    if (updateError) {
       console.error('❌ Error updating user:', updateError.message);
    } else {
       console.log('✅ User updated successfully with admin role.');
    }
  } else {
    console.log('User does not exist. Creating with admin role...');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto confirm email
      app_metadata: { role: 'admin' }
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
    } else {
      console.log('✅ Admin user created successfully:', data.user.id);
    }
  }
}

createAdmin();
