import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase issues a short-lived JWT **access token** + a rotating **refresh token**
// on every sign-in (password / Google / OTP). These options make the client:
//  - persistSession:     store the tokens so a page refresh keeps you logged in
//  - autoRefreshToken:   silently swap the access token using the refresh token
//  - detectSessionInUrl: complete the OAuth redirect (Google) automatically
//  - flowType 'pkce':    the secure Authorization-Code-with-PKCE flow for OAuth
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
