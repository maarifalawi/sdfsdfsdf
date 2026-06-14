// insert_admin.js
// Jalankan: node insert_admin.js
// Ini akan memasukkan akun admin ke Supabase

require('dotenv').config();
const supabase = require('./src/services/supabaseClient');
const bcrypt = require('bcrypt');

async function insertAdmin() {
  console.log('\n=== INSERT ADMIN USER ===\n');

  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    // Hash password dengan bcrypt
    console.log(`Hashing password...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Hash created: ${hashedPassword.substring(0, 20)}...`);

    // Insert user
    console.log(`Inserting admin user: ${email}`);
    const { data, error } = await supabase
      .from('users')
      .upsert(
        [
          {
            email,
            password: hashedPassword,
            role: 'admin'
          }
        ],
        { onConflict: 'email' }
      )
      .select();

    if (error) {
      console.error('❌ Error inserting admin:', error);
      
      if (error.code === '42501') {
        console.error('\n⚠️  Row Level Security (RLS) is blocking the insert!');
        console.error('Solution: Run ../sql/disable_rls_and_insert_admin.sql in Supabase SQL Editor');
        console.error('Then run this script again.\n');
      }
      
      process.exit(1);
    }

    console.log('✅ Admin user inserted/updated successfully!');
    console.log('User:', data[0]);

    // Verify
    console.log(`\nVerifying admin user...`);
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('id,email,role')
      .eq('email', email)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
      process.exit(1);
    }

    console.log('✅ Verification successful!');
    console.log('Admin user:', verifyData);

    console.log('\n=== ADMIN LOGIN CREDENTIALS ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('================================\n');

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

insertAdmin();
