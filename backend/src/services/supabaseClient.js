const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;

// Try to use SERVICE_ROLE first, fallback to ANON
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let keyType = 'SERVICE_ROLE';

if (!supabaseKey) {
  supabaseKey = process.env.SUPABASE_ANON_KEY;
  keyType = 'ANON';
}

if (!supabaseUrl || !supabaseKey) {
  console.error('================================');
  console.error('SUPABASE ENV ERROR');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_KEY:', supabaseKey ? '[MASKED]' : 'MISSING');
  console.error('================================');

  throw new Error(
    'SUPABASE_URL dan (SUPABASE_SERVICE_ROLE_KEY atau SUPABASE_ANON_KEY) wajib diisi di file .env'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

console.log('================================');
console.log('SUPABASE CONNECTED');
console.log('URL:', supabaseUrl);
console.log('KEY TYPE:', keyType);
console.log('================================');

module.exports = supabase;
