// debug_supabase_full.js
// Jalankan: node debug_supabase_full.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;
const jwtSecret = process.env.JWT_SECRET;

console.log('\n=== ENVIRONMENT VARIABLES ===');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SERVICE_ROLE_KEY exists:', !!serviceRoleKey);
console.log('ANON_KEY exists:', !!anonKey);
console.log('JWT_SECRET exists:', !!jwtSecret);

// Test dengan service role key
async function testServiceRole() {
  console.log('\n=== TEST WITH SERVICE_ROLE_KEY ===');
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' });

    console.log('Result:', { data, error, count });
  } catch (e) {
    console.error('Exception:', e.message);
  }
}

// Test dengan anon key
async function testAnon() {
  console.log('\n=== TEST WITH ANON_KEY ===');
  try {
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false }
    });

    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' });

    console.log('Result:', { data, error, count });
  } catch (e) {
    console.error('Exception:', e.message);
  }
}

// Test specific query
async function testSpecificQuery() {
  console.log('\n=== TEST SPECIFIC LOGIN QUERY ===');
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await supabase
      .from('users')
      .select('id,email,password,role')
      .eq('email', 'admin@example.com')
      .maybeSingle();

    console.log('Admin query:', { data, error });
  } catch (e) {
    console.error('Exception:', e.message);
  }
}

async function runAll() {
  await testServiceRole();
  await testAnon();
  await testSpecificQuery();
  process.exit(0);
}

runAll().catch(console.error);
