import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log("--- SUPABASE DEBUG ---");
console.log("URL:", JSON.stringify(supabaseUrl));
console.log("KEY LENGTH:", supabaseAnonKey.length);
console.log("----------------------");

if (!supabaseUrl.startsWith('https://')) {
  throw new Error(`Invalid Supabase URL detected: "${supabaseUrl}". It must start with https://`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);